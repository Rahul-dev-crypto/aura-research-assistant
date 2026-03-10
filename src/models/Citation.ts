import mongoose from 'mongoose';

const CitationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['book', 'journal', 'website', 'conference'],
        required: true,
        default: 'journal'
    },
    authors: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    publisher: String,
    journal: String,
    volume: String,
    pages: String,
    url: String,
    doi: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Citation = mongoose.models.Citation || mongoose.model('Citation', CitationSchema);
