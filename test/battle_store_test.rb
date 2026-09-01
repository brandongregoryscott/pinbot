# frozen_string_literal: true

require 'minitest/autorun'
require 'tmpdir'
require_relative '../src/battle_store'

class BattleStoreTest < Minitest::Test
  def setup
    @directory = Dir.mktmpdir
    @path = File.join(@directory, 'pinbot.sqlite3')
    @store = BattleStore.new(@path)
    @now = Time.utc(2026, 8, 31, 12)
  end

  def teardown
    @store.close
    FileUtils.remove_entry(@directory)
  end

  def test_starts_only_one_active_battle_with_distinct_lazy_pins
    battle = start_battle

    assert battle
    refute_equal battle['pin_a_id'], battle['pin_b_id']
    assert_equal '10', @store.pin(battle['pin_a_id'])['discord_channel_id']
    assert_equal '20', @store.pin(battle['pin_b_id'])['discord_channel_id']
    assert_nil @store.start_battle(
      pin_a_message_id: '333', pin_a_channel_id: '30',
      pin_b_message_id: '444', pin_b_channel_id: '40', channel_id: '999',
      started_at: @now, ends_at: @now + 3600
    )
    assert_equal battle['id'], @store.active_battle['id']
  end

  def test_rejects_same_pin_on_both_sides
    assert_raises(ArgumentError) do
      @store.start_battle(
        pin_a_message_id: '111', pin_a_channel_id: '10',
        pin_b_message_id: '111', pin_b_channel_id: '10', channel_id: '999',
        started_at: @now, ends_at: @now + 3600
      )
    end
  end

  def test_vote_upsert_changes_a_users_single_vote
    battle = start_battle

    counts = @store.record_vote(
      battle_id: battle['id'], discord_user_id: 'user-1', pin_id: battle['pin_a_id'], at: @now
    )
    assert_equal({ battle['pin_a_id'] => 1 }, counts)

    counts = @store.record_vote(
      battle_id: battle['id'], discord_user_id: 'user-1', pin_id: battle['pin_b_id'], at: @now + 1
    )
    assert_equal({ battle['pin_b_id'] => 1 }, counts)
  end

  def test_removing_old_reaction_does_not_remove_new_vote
    battle = start_battle
    @store.record_vote(
      battle_id: battle['id'], discord_user_id: 'user-1', pin_id: battle['pin_a_id']
    )
    @store.record_vote(
      battle_id: battle['id'], discord_user_id: 'user-1', pin_id: battle['pin_b_id']
    )

    counts = @store.remove_vote(
      battle_id: battle['id'], discord_user_id: 'user-1', pin_id: battle['pin_a_id']
    )
    assert_equal({ battle['pin_b_id'] => 1 }, counts)
  end

  def test_three_votes_resolve_once_and_increment_exact_totals
    battle = start_battle
    vote(battle, 'one', battle['pin_a_id'])
    vote(battle, 'two', battle['pin_a_id'])
    vote(battle, 'three', battle['pin_b_id'])

    result = @store.resolve(battle_id: battle['id'], ended_at: @now + 3)

    assert_equal battle['pin_a_id'], result['winner_pin_id']
    assert_equal 0, result['is_draw']
    assert_equal 1, @store.pin(battle['pin_a_id'])['wins']
    assert_equal 1, @store.pin(battle['pin_b_id'])['losses']
    assert_nil @store.resolve(battle_id: battle['id'], ended_at: @now + 4)
    assert_equal 1, @store.pin(battle['pin_a_id'])['wins']
    assert_equal 1, @store.pin(battle['pin_b_id'])['losses']
  end

  def test_one_to_one_timeout_is_draw_without_changed_totals
    battle = start_battle
    vote(battle, 'one', battle['pin_a_id'])
    vote(battle, 'two', battle['pin_b_id'])

    result = @store.resolve(
      battle_id: battle['id'], ended_at: @now + 3600,
      display_choice_pin_id: battle['pin_a_id']
    )

    assert_equal 1, result['is_draw']
    assert_nil result['winner_pin_id']
    assert_equal battle['pin_a_id'], result['display_choice_pin_id']
    assert_equal 0, @store.pin(battle['pin_a_id'])['wins']
    assert_equal 0, @store.pin(battle['pin_b_id'])['losses']
  end

  def test_zero_to_zero_timeout_is_draw
    battle = start_battle

    result = @store.resolve(
      battle_id: battle['id'], ended_at: @now + 3600,
      display_choice_pin_id: battle['pin_b_id']
    )

    assert_equal 1, result['is_draw']
    assert_equal battle['pin_b_id'], result['display_choice_pin_id']
  end

  def test_completed_battle_ignores_late_votes_and_survives_restart
    battle = start_battle
    vote(battle, 'one', battle['pin_a_id'])
    @store.resolve(battle_id: battle['id'], ended_at: @now + 1)
    assert_nil @store.record_vote(
      battle_id: battle['id'], discord_user_id: 'late', pin_id: battle['pin_b_id']
    )
    next_battle = @store.start_battle(
      pin_a_message_id: '333', pin_a_channel_id: '30',
      pin_b_message_id: '444', pin_b_channel_id: '40', channel_id: '999',
      started_at: @now + 2, ends_at: @now + 3602
    )
    assert next_battle
    @store.cancel_unposted_battle(next_battle['id'])

    @store.close
    @store = BattleStore.new(@path)
    assert_equal 1, @store.pin(battle['pin_a_id'])['wins']
    assert_nil @store.active_battle
  end

  def test_active_battle_survives_restart
    battle = start_battle
    @store.attach_message(battle['id'], '555')
    @store.close

    @store = BattleStore.new(@path)

    assert_equal battle['id'], @store.active_battle['id']
    assert_equal '555', @store.active_battle['discord_battle_message_id']
  end

  def test_concurrent_resolution_has_only_one_winner_and_one_increment
    battle = start_battle
    vote(battle, 'one', battle['pin_a_id'])
    results = 2.times.map do
      Thread.new { @store.resolve(battle_id: battle['id'], ended_at: @now + 1) }
    end.map(&:value)

    assert_equal 1, results.compact.length
    assert_equal 1, @store.pin(battle['pin_a_id'])['wins']
    assert_equal 1, @store.pin(battle['pin_b_id'])['losses']
  end

  def test_cancel_closes_battle_without_changing_totals
    battle = start_battle
    vote(battle, 'one', battle['pin_a_id'])

    result = @store.cancel_battle(battle_id: battle['id'], ended_at: @now + 1)

    assert_equal 'cancelled', result['status']
    assert_nil @store.active_battle
    assert_equal 0, @store.pin(battle['pin_a_id'])['wins']
    assert_equal 0, @store.pin(battle['pin_b_id'])['losses']
    assert_nil @store.cancel_battle(battle_id: battle['id'], ended_at: @now + 2)
  end

  private

  def start_battle
    @store.start_battle(
      pin_a_message_id: '111', pin_a_channel_id: '10',
      pin_b_message_id: '222', pin_b_channel_id: '20', channel_id: '999',
      started_at: @now, ends_at: @now + 3600
    )
  end

  def vote(battle, user_id, pin_id)
    @store.record_vote(battle_id: battle['id'], discord_user_id: user_id, pin_id: pin_id)
  end
end
