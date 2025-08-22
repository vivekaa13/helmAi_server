const { Client } = require('@opensearch-project/opensearch');
const { BedrockRuntime } = require('@aws-sdk/client-bedrock-runtime');

class OpenSearchService {
    constructor() {
        this.client = null;
        this.bedrockClient = null;
        this.indexName = 'intent-vectors';
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing OpenSearch service...');
            console.log('📍 Endpoint:', process.env.OPENSEARCH_ENDPOINT);
            console.log('👤 Username:', process.env.OPENSEARCH_USERNAME);
            
            this.client = new Client({
                node: process.env.OPENSEARCH_ENDPOINT || 'https://search-helmaidomain-abc123.us-east-1.es.amazonaws.com',
                auth: {
                    username: process.env.OPENSEARCH_USERNAME || 'admin',
                    password: process.env.OPENSEARCH_PASSWORD || 'Admin123!'
                }
            });

            this.bedrockClient = new BedrockRuntime({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                }
            });

            await this.createIndex();
            this.initialized = true;
            console.log('✅ OpenSearch service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize OpenSearch service:', error.message);
            console.error('🔧 Full error:', error);
            throw error;
        }
    }

    async createIndex() {
        try {
            const exists = await this.client.indices.exists({ index: this.indexName });
            if (!exists.body) {
                await this.client.indices.create({
                    index: this.indexName,
                    body: {
                        mappings: {
                            properties: {
                                text: { type: 'text' },
                                intent: { type: 'keyword' },
                                category: { type: 'keyword' },
                                priority: { type: 'keyword' },
                                vector: {
                                    type: 'knn_vector',
                                    dimension: 1536,
                                    method: {
                                        name: 'hnsw',
                                        space_type: 'cosinesimil',
                                        engine: 'nmslib'
                                    }
                                }
                            }
                        },
                        settings: {
                            'index.knn': true
                        }
                    }
                });
                console.log(`Index ${this.indexName} created successfully`);
            }
        } catch (error) {
            console.error('Error creating index:', error.message);
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

    async indexDocument(document) {
        try {
            const vector = await this.generateEmbedding(document.text);
            
            await this.client.index({
                index: this.indexName,
                id: document.id,
                body: {
                    ...document,
                    vector
                }
            });
        } catch (error) {
            console.error('Error indexing document:', error.message);
            throw error;
        }
    }

    async batchIndexDocuments(documents) {
        try {
            const operations = [];
            
            for (const doc of documents) {
                const vector = await this.generateEmbedding(doc.text);
                
                operations.push({
                    index: {
                        _index: this.indexName,
                        _id: doc.id
                    }
                });
                
                operations.push({
                    ...doc,
                    vector
                });
            }

            const response = await this.client.bulk({
                body: operations
            });

            if (response.body.errors) {
                console.error('Bulk indexing errors:', response.body.items.filter(item => item.index.error));
            }

            return response.body;
        } catch (error) {
            console.error('Error batch indexing documents:', error.message);
            throw error;
        }
    }

    async searchSimilarIntents(query, threshold = 0.3) {
        try {
            const queryVector = await this.generateEmbedding(query);
            
            const response = await this.client.search({
                index: this.indexName,
                body: {
                    size: 10,
                    query: {
                        knn: {
                            vector: {
                                vector: queryVector,
                                k: 10
                            }
                        }
                    }
                }
            });

            const hits = response.body.hits.hits;
            
            if (hits.length === 0 || hits[0]._score < threshold) {
                return { intent: 'others', confidence: 0 };
            }

            const bestMatch = hits[0];
            return {
                intent: bestMatch._source.intent,
                confidence: bestMatch._score,
                category: bestMatch._source.category,
                priority: bestMatch._source.priority,
                matchedText: bestMatch._source.text
            };
        } catch (error) {
            console.error('Error searching intents:', error.message);
            return { intent: 'others', confidence: 0, error: error.message };
        }
    }

    async deleteIndex() {
        try {
            await this.client.indices.delete({ index: this.indexName });
            console.log(`Index ${this.indexName} deleted successfully`);
        } catch (error) {
            console.error('Error deleting index:', error.message);
            throw error;
        }
    }

    async getIndexStats() {
        try {
            console.log('🔍 Checking OpenSearch index stats...');
            console.log('📍 OpenSearch endpoint:', process.env.OPENSEARCH_ENDPOINT);
            console.log('📄 Index name:', this.indexName);
            
            const response = await this.client.count({ index: this.indexName });
            console.log('✅ OpenSearch response:', response.body);
            
            return {
                documentCount: response.body.count,
                indexName: this.indexName
            };
        } catch (error) {
            console.error('❌ Error getting index stats:', error.message);
            console.error('🔧 Full error:', error);
            return { 
                documentCount: 0, 
                indexName: this.indexName, 
                error: error.message,
                endpoint: process.env.OPENSEARCH_ENDPOINT
            };
        }
    }

    async getStats() {
        return await this.getIndexStats();
    }

    async addDocuments(documents) {
        return await this.batchIndexDocuments(documents);
    }

    async clearDatabase() {
        try {
            await this.deleteIndex();
            await this.createIndex();
            return {
                success: true,
                message: 'Database cleared successfully'
            };
        } catch (error) {
            console.error('Error clearing database:', error.message);
            throw error;
        }
    }
}

module.exports = new OpenSearchService();
