const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Message = require('./models/message');

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// Folder containing JSON files
const PAYLOAD_FOLDER = './payloads';


const files = fs.readdirSync(PAYLOAD_FOLDER);

(async () => {
  for (const file of files) {
    const filePath = path.join(PAYLOAD_FOLDER, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const change = content.metaData?.entry?.[0]?.changes?.[0];
    if (!change || change.field !== 'messages') continue;

    const msg = change.value.messages?.[0];
    const contact = change.value.contacts?.[0];
    const wa_id = contact?.wa_id;
    const name = contact?.profile?.name;
    const msg_id = msg?.id;
    const timestamp = new Date(parseInt(msg?.timestamp) * 1000);
    const body = msg?.text?.body;

    if (msg?.type === 'text' && body) {
      await Message.updateOne(
        { msg_id },
        {
          $setOnInsert: {
            wa_id,
            name,
            msg_id,
            text: body,
            timestamp,
            status: 'sent'
          }
        },
        { upsert: true }
      );
      console.log(`✅ Inserted message: ${msg_id}`);
    }
  }

  console.log("✅ All payloads processed.");
  process.exit();
})();