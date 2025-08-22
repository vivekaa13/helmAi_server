const vectorService = require('../services/openSearchService');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class IntentController {
    async recognizeIntent(req, res) {
        try {
            const { text, threshold = 0.3 } = req.body;
            
            if (!text) {
                return res.status(400).json({
                    error: 'Text is required',
                    intent: 'others'
                });
            }

            if (!vectorService.initialized) {
                await vectorService.initialize();
            }

            const result = await vectorService.searchSimilarIntents(text, threshold);
            
            res.json({
                success: true,
                query: text,
                intent: result.intent,
                confidence: result.confidence,
                category: result.category,
                priority: result.priority,
                matchedText: result.matchedText
            });
        } catch (error) {
            console.error('Error recognizing intent:', error);
            res.status(500).json({
                error: 'Failed to recognize intent',
                intent: 'others'
            });
        }
    }

    async populateDatabase(req, res) {
        try {
            if (!vectorService.initialized) {
                await vectorService.initialize();
            }

            const dataPath = path.join(__dirname, '../data/intents');
            const intentFolders = fs.readdirSync(dataPath);
            let totalDocuments = 0;
            let processedDocuments = 0;

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Transfer-Encoding': 'chunked'
            });

            res.write(JSON.stringify({ 
                status: 'started', 
                message: `Found ${intentFolders.length} intent folders` 
            }) + '\n');

            for (const folder of intentFolders) {
                const folderPath = path.join(dataPath, folder);
                if (!fs.statSync(folderPath).isDirectory()) continue;

                const csvFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.csv'));
                
                for (const csvFile of csvFiles) {
                    const filePath = path.join(folderPath, csvFile);
                    const documents = [];

                    await new Promise((resolve, reject) => {
                        fs.createReadStream(filePath)
                            .pipe(csv())
                            .on('data', (row) => {
                                if (row.text && row.intent) {
                                    documents.push({
                                        id: row.id,
                                        text: row.text.replace(/"/g, ''),
                                        intent: row.intent,
                                        category: row.category,
                                        priority: row.priority
                                    });
                                }
                            })
                            .on('end', resolve)
                            .on('error', reject);
                    });

                    if (documents.length > 0) {
                        const results = await vectorService.addDocuments(documents);
                        processedDocuments += results.length;
                        
                        res.write(JSON.stringify({
                            status: 'processing',
                            processed: processedDocuments,
                            currentFile: csvFile,
                            currentIntent: folder
                        }) + '\n');
                        
                        totalDocuments += documents.length;
                    }
                }
            }

            const stats = vectorService.getStats();
            
            res.write(JSON.stringify({
                status: 'completed',
                totalProcessed: processedDocuments,
                stats: stats,
                message: 'Database populated successfully'
            }) + '\n');
            
            res.end();
        } catch (error) {
            console.error('Error populating database:', error);
            res.status(500).json({
                error: 'Failed to populate database',
                details: error.message
            });
        }
    }

    async populateSingleFile(req, res) {
        try {
            if (!vectorService.initialized) {
                await vectorService.initialize();
            }

            const { fileName = 'flight_booking_1.csv', intentFolder = 'flight_booking' } = req.body;
            
            const filePath = path.join(__dirname, '../data/intents', intentFolder, fileName);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    error: 'File not found',
                    path: filePath
                });
            }

            const documents = [];
            let processedCount = 0;

            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (row) => {
                        if (row.text && row.intent) {
                            documents.push({
                                id: row.id,
                                text: row.text.replace(/"/g, ''),
                                intent: row.intent,
                                category: row.category,
                                priority: row.priority
                            });
                        }
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            if (documents.length > 0) {
                const results = await vectorService.addDocuments(documents);
                processedCount = results.length;
            }

            const stats = await vectorService.getStats();
            
            res.json({
                success: true,
                message: `Successfully processed ${processedCount} documents from ${fileName}`,
                processed: processedCount,
                fileName: fileName,
                intentFolder: intentFolder,
                stats: stats
            });

        } catch (error) {
            console.error('Error populating single file:', error);
            res.status(500).json({
                error: 'Failed to populate single file',
                details: error.message
            });
        }
    }

    async getStats(req, res) {
        try {
            if (!vectorService.initialized) {
                await vectorService.initialize();
            }

            const stats = await vectorService.getStats();
            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({
                error: 'Failed to get stats',
                details: error.message
            });
        }
    }

    async clearDatabase(req, res) {
        try {
            if (!vectorService.initialized) {
                await vectorService.initialize();
            }

            const result = vectorService.clearDatabase();
            res.json(result);
        } catch (error) {
            console.error('Error clearing database:', error);
            res.status(500).json({
                error: 'Failed to clear database',
                details: error.message
            });
        }
    }
}

module.exports = new IntentController();
