# frozen_string_literal: true

require 'fileutils'
require 'sqlite3'
require 'time'

class BattleStore
  ACTIVE_STATUS = 'active'

  attr_reader :path

  def initialize(path)
    @path = path
    FileUtils.mkdir_p(File.dirname(path))
    @db = SQLite3::Database.new(path)
    @db.results_as_hash = true
    @mutex = Mutex.new
    configure
    migrate
  end

  def start_battle(pin_a_message_id:, pin_a_channel_id:, pin_b_message_id:, pin_b_channel_id:, channel_id:, started_at:, ends_at:)
    synchronize_transaction do
      pin_a_id = find_or_create_pin(pin_a_message_id, pin_a_channel_id)
      pin_b_id = find_or_create_pin(pin_b_message_id, pin_b_channel_id)
      raise ArgumentError, 'battle pins must be distinct' if pin_a_id == pin_b_id

      @db.execute(
        <<~SQL,
          INSERT INTO battles (
            pin_a_id, pin_b_id, discord_channel_id, status, is_draw, started_at, ends_at
          ) VALUES (?, ?, ?, 'active', 0, ?, ?)
        SQL
        [pin_a_id, pin_b_id, channel_id.to_s, timestamp(started_at), timestamp(ends_at)]
      )
      battle(@db.last_insert_row_id)
    end
  rescue SQLite3::ConstraintException => e
    raise unless e.message.include?('one_active_battle') || e.message.include?('UNIQUE constraint failed')

    nil
  end

  def attach_message(battle_id, discord_message_id)
    synchronize do
      @db.execute(
        'UPDATE battles SET discord_battle_message_id = ? WHERE id = ? AND status = ?',
        [discord_message_id.to_s, battle_id, ACTIVE_STATUS]
      )
      battle(battle_id)
    end
  end

  def cancel_unposted_battle(battle_id, ended_at: Time.now)
    synchronize do
      @db.execute(
        "UPDATE battles SET status = 'cancelled', ended_at = ? WHERE id = ? AND status = 'active' AND discord_battle_message_id IS NULL",
        [timestamp(ended_at), battle_id]
      )
    end
  end

  # Returns the cancelled battle only to the caller that won the close race.
  def cancel_battle(battle_id:, ended_at: Time.now)
    synchronize_transaction do
      current = battle(battle_id)
      next nil unless current && current['status'] == ACTIVE_STATUS

      @db.execute(
        "UPDATE battles SET status = 'cancelled', ended_at = ? WHERE id = ? AND status = 'active'",
        [timestamp(ended_at), battle_id]
      )
      next nil if @db.changes.zero?

      hydrate_battle(@db.get_first_row('SELECT * FROM battles WHERE id = ?', [battle_id]))
    end
  end

  def active_battle
    synchronize { active_battle_without_lock }
  end

  def active_battle_for_message(discord_message_id)
    synchronize do
      row = @db.get_first_row(
        "SELECT * FROM battles WHERE status = 'active' AND discord_battle_message_id = ?",
        [discord_message_id.to_s]
      )
      hydrate_battle(row)
    end
  end

  def record_vote(battle_id:, discord_user_id:, pin_id:, at: Time.now)
    synchronize_transaction do
      current = battle(battle_id)
      next nil unless current && current['status'] == ACTIVE_STATUS
      next nil unless [current['pin_a_id'], current['pin_b_id']].include?(pin_id.to_i)

      now = timestamp(at)
      @db.execute(
        <<~SQL,
          INSERT INTO votes (battle_id, discord_user_id, pin_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(battle_id, discord_user_id)
          DO UPDATE SET pin_id = excluded.pin_id, updated_at = excluded.updated_at
        SQL
        [battle_id, discord_user_id.to_s, pin_id, now, now]
      )
      vote_counts_without_lock(battle_id)
    end
  end

  def remove_vote(battle_id:, discord_user_id:, pin_id:)
    synchronize_transaction do
      current = battle(battle_id)
      next nil unless current && current['status'] == ACTIVE_STATUS

      @db.execute(
        'DELETE FROM votes WHERE battle_id = ? AND discord_user_id = ? AND pin_id = ?',
        [battle_id, discord_user_id.to_s, pin_id]
      )
      vote_counts_without_lock(battle_id)
    end
  end

  def vote_counts(battle_id)
    synchronize { vote_counts_without_lock(battle_id) }
  end

  # Returns the completed battle only to the caller that won the resolution race.
  def resolve(battle_id:, ended_at: Time.now, display_choice_pin_id: nil)
    synchronize_transaction do
      current = battle(battle_id)
      next nil unless current && current['status'] == ACTIVE_STATUS

      counts = vote_counts_without_lock(battle_id)
      a_votes = counts.fetch(current['pin_a_id'], 0)
      b_votes = counts.fetch(current['pin_b_id'], 0)
      is_draw = a_votes == b_votes
      winner_pin_id = if is_draw
                        nil
                      elsif a_votes > b_votes
                        current['pin_a_id']
                      else
                        current['pin_b_id']
                      end

      changed = @db.execute(
        <<~SQL,
          UPDATE battles
          SET status = 'completed', winner_pin_id = ?, is_draw = ?,
              display_choice_pin_id = ?, ended_at = ?
          WHERE id = ? AND status = 'active'
        SQL
        [winner_pin_id, is_draw ? 1 : 0, is_draw ? display_choice_pin_id : nil, timestamp(ended_at), battle_id]
      )
      next nil if @db.changes.zero? || changed.nil?

      unless is_draw
        loser_pin_id = winner_pin_id == current['pin_a_id'] ? current['pin_b_id'] : current['pin_a_id']
        now = timestamp(ended_at)
        @db.execute('UPDATE pins SET wins = wins + 1, updated_at = ? WHERE id = ?', [now, winner_pin_id])
        @db.execute('UPDATE pins SET losses = losses + 1, updated_at = ? WHERE id = ?', [now, loser_pin_id])
      end

      hydrate_battle(@db.get_first_row('SELECT * FROM battles WHERE id = ?', [battle_id]))
    end
  end

  def pin(pin_id)
    synchronize { @db.get_first_row('SELECT * FROM pins WHERE id = ?', [pin_id]) }
  end

  def close
    synchronize { @db.close }
  end

  private

  def configure
    @db.busy_timeout = 5000
    @db.execute('PRAGMA foreign_keys = ON')
    @db.execute('PRAGMA journal_mode = WAL')
  end

  def migrate
    synchronize_transaction do
      @db.execute_batch <<~SQL
        CREATE TABLE IF NOT EXISTS pins (
          id INTEGER PRIMARY KEY,
          discord_message_id TEXT NOT NULL UNIQUE,
          discord_channel_id TEXT,
          wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
          losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS battles (
          id INTEGER PRIMARY KEY,
          pin_a_id INTEGER NOT NULL REFERENCES pins(id),
          pin_b_id INTEGER NOT NULL REFERENCES pins(id),
          discord_channel_id TEXT NOT NULL,
          discord_battle_message_id TEXT UNIQUE,
          status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
          winner_pin_id INTEGER REFERENCES pins(id),
          display_choice_pin_id INTEGER REFERENCES pins(id),
          is_draw INTEGER NOT NULL DEFAULT 0 CHECK (is_draw IN (0, 1)),
          started_at TEXT NOT NULL,
          ends_at TEXT NOT NULL,
          ended_at TEXT,
          CHECK (pin_a_id <> pin_b_id)
        );

        CREATE UNIQUE INDEX IF NOT EXISTS one_active_battle
          ON battles(status) WHERE status = 'active';

        CREATE TABLE IF NOT EXISTS votes (
          id INTEGER PRIMARY KEY,
          battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
          discord_user_id TEXT NOT NULL,
          pin_id INTEGER NOT NULL REFERENCES pins(id),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE (battle_id, discord_user_id)
        );

        CREATE INDEX IF NOT EXISTS votes_by_battle ON votes(battle_id);
        CREATE INDEX IF NOT EXISTS battles_by_message ON battles(discord_battle_message_id);
      SQL
      ensure_column('pins', 'discord_channel_id', 'TEXT')
    end
  end

  def ensure_column(table, column, definition)
    columns = @db.execute("PRAGMA table_info(#{table})").map { |row| row['name'] }
    @db.execute("ALTER TABLE #{table} ADD COLUMN #{column} #{definition}") unless columns.include?(column)
  end

  def find_or_create_pin(discord_message_id, discord_channel_id)
    now = timestamp(Time.now)
    @db.execute(
      <<~SQL,
        INSERT INTO pins (discord_message_id, discord_channel_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(discord_message_id)
        DO UPDATE SET discord_channel_id = excluded.discord_channel_id, updated_at = excluded.updated_at
      SQL
      [discord_message_id.to_s, discord_channel_id.to_s, now, now]
    )
    @db.get_first_value('SELECT id FROM pins WHERE discord_message_id = ?', [discord_message_id.to_s])
  end

  def battle(id)
    hydrate_battle(@db.get_first_row('SELECT * FROM battles WHERE id = ?', [id]))
  end

  def active_battle_without_lock
    hydrate_battle(@db.get_first_row("SELECT * FROM battles WHERE status = 'active' LIMIT 1"))
  end

  def hydrate_battle(row)
    return nil unless row

    row.merge('vote_counts' => vote_counts_without_lock(row['id']))
  end

  def vote_counts_without_lock(battle_id)
    @db.execute(
      'SELECT pin_id, COUNT(*) AS count FROM votes WHERE battle_id = ? GROUP BY pin_id',
      [battle_id]
    ).to_h { |row| [row['pin_id'].to_i, row['count'].to_i] }
  end

  def timestamp(time)
    time.utc.iso8601(6)
  end

  def synchronize(&block)
    @mutex.synchronize(&block)
  end

  def synchronize_transaction
    synchronize do
      begin
        @db.transaction(:immediate)
        result = yield
        @db.commit
        result
      rescue StandardError
        @db.rollback if @db.transaction_active?
        raise
      end
    end
  end
end
