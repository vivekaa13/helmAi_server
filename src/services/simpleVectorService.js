const { BedrockRuntime } = require('@aws-sdk/client-bedrock-runtime');

class SimpleVectorService {
    constructor() {
        this.documents = new Map();
        this.bedrockClient = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            this.bedrockClient = new BedrockRuntime({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                }
            });

            this.initialized = true;
            console.log('Simple Vector service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Simple Vector service:', error.message);
            throw error;
        }
    }

    async generateEmbedding(text) {
        try {
            const response = await this.bedrockClient.invokeModel({
                modelId: 'amazon.titan-embed-text-v1',
                body: JSON.stringify({
                    inputText: text
                })
            });

            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            return responseBody.embedding;
        } catch (error) {
            console.error('Error generating embedding:', error.message);
            throw error;
        }
    }

    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    async addDocument(document) {
        try {
            const vector = await this.generateEmbedding(document.text);
            this.documents.set(document.id, {
                ...document,
                vector
            });
        } catch (error) {
            console.error('Error adding document:', error.message);
            throw error;
        }
    }

    async addDocuments(documents) {
        const results = [];
        for (const doc of documents) {
            try {
                await this.addDocument(doc);
                results.push({ id: doc.id, status: 'success' });
            } catch (error) {
                results.push({ id: doc.id, status: 'error', error: error.message });
            }
        }
        return results;
    }

    async searchSimilarIntents(query, threshold = 0.3) {
        try {
            if (this.documents.size === 0) {
                return { intent: 'others', confidence: 0 };
            }

            const queryVector = await this.generateEmbedding(query);
            let bestMatch = null;
            let bestScore = -1;

            for (const [id, doc] of this.documents) {
                const similarity = this.cosineSimilarity(queryVector, doc.vector);
                if (similarity > bestScore) {
                    bestScore = similarity;
                    bestMatch = doc;
                }
            }

            if (!bestMatch || bestScore < threshold) {
                return { intent: 'others', confidence: bestScore || 0 };
            }

            return {
                intent: bestMatch.intent,
                confidence: bestScore,
                category: bestMatch.category,
                priority: bestMatch.priority,
                matchedText: bestMatch.text
            };
        } catch (error) {
            console.error('Error searching intents:', error.message);
            return { intent: 'others', confidence: 0, error: error.message };
        }
    }

    clearDatabase() {
        this.documents.clear();
        return { success: true, message: 'Database cleared successfully' };
    }

    getStats() {
        const intentCounts = {};
        for (const [id, doc] of this.documents) {
            intentCounts[doc.intent] = (intentCounts[doc.intent] || 0) + 1;
        }

        return {
            documentCount: this.documents.size,
            intents: intentCounts
        };
    }
}

module.exports = new SimpleVectorService();
