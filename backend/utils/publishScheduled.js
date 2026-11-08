const Content = require("../models/content");

async function publishScheduledContent() {
    const due = await Content.find({
        status: "Scheduled",
        scheduledAt: { $lte: new Date() }
    }).select("_id scheduledAt");

    if (due.length === 0) return 0;

    await Content.bulkWrite(due.map(content => ({
        updateOne: {
            filter: { _id: content._id, status: "Scheduled" },
            update: {
                $set: {
                    status: "Published",
                    publishedAt: content.scheduledAt
                }
            }
        }
    })));

    return due.length;
}

module.exports = publishScheduledContent;
