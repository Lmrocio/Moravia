import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema(
  {
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true },
    imageId: { type: String, default: null },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
);

ticketSchema.index({ communityId: 1, status: 1 });
ticketSchema.index({ authorId: 1 });
ticketSchema.index({ 'messages.authorId': 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
