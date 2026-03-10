import mongoose, { Schema, Document } from 'mongoose';

export interface IResearchItem extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    type: 'synthesis' | 'proposal' | 'paper' | 'intelligence-hub' | 'analysis' | 'questions' | 'abstract' | 'plagiarism' | 'keywords' | 'refiner';
    content: string;
    sourcePrompt?: string;
    createdAt: Date;
}

const ResearchItemSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['synthesis', 'proposal', 'paper', 'intelligence-hub', 'analysis', 'questions', 'abstract', 'plagiarism', 'keywords', 'refiner'], required: true },
    content: { type: String, required: true },
    sourcePrompt: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// Avoid recompiling model in Next.js development
export const ResearchItem = mongoose.models.ResearchItem || mongoose.model<IResearchItem>('ResearchItem', ResearchItemSchema);
