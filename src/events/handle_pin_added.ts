const handlePinAdded = async (bot, message) => {
    const { item } = message;
    const pin = item.message;
    const userResponse = await bot.api.users.info({ user: pin.user });
    const profile = userResponse.user.profile;

    const conversationResponse = await bot.api.conversations.info({
        channel: item.channel,
    });
    const { channel } = conversationResponse;

    await bot.reply(message, {
        attachments: [
            {
                color: "#d4d4d4",
                blocks: [
                    headerBlock(profile),
                    ...innerContent(pin),
                    footerBlock(channel, pin),
                ],
            },
        ],
    });
};

module.exports = function (controller) {
    controller.on("pin_added", handlePinAdded);
};

const footerBlock = (channel, pin) => ({
    type: "context",
    elements: [
        {
            type: "mrkdwn",
            text: `Posted in *#${channel.name}*`,
        },
        {
            type: "mrkdwn",
            text: "*|*",
        },
        {
            type: "mrkdwn",
            text: `_${new Date().setTime(Number(pin.ts))}_`,
        },
    ],
});

const headerBlock = (profile) => ({
    type: "context",
    elements: [
        {
            type: "image",
            image_url: profile.image_32,
            alt_text: "user avatar",
        },
        {
            type: "mrkdwn",
            text: `*${profile.display_name ?? profile.real_name}*`,
        },
    ],
});

const innerContent = (pin) =>
    pin.blocks != null
        ? pin.blocks
        : [
              {
                  type: "context",
                  elements: [
                      {
                          type: "mrkdwn",
                          text: pin.text,
                      },
                  ],
              },
          ];
