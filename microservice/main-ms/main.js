const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const path = require('path');
const readline = require('readline');
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }))


const packageDefinitionReci = protoLoader.loadSync(path.join(__dirname, '../protos/recipes.proto'))
const packageDefinitionProc = protoLoader.loadSync(path.join(__dirname, '../protos/processing.proto'));

const recipesProto = grpc.loadPackageDefinition(packageDefinitionReci)
const processingProto = grpc.loadPackageDefinition(packageDefinitionProc)

const recipesStub = new recipesProto.Recipes('0.0.0.0:50051', grpc.credentials.createInsecure());
const processingStub = new processingProto.Processing('0.0.0.0:50052', grpc.credentials.createInsecure());

//user data input
{
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter the product Id: ', (proudctId) => {
        rl.question(`Enter the recipe ID: `, (orderId) => {
            Recipe(proudctId, orderId);
            rl.close();
        })
    });

    function Recipe(id, orderId) {

        recipesStub.findRecipe({ id }, function (err, recipe) {
            if (err) {
                if (err.code === grpc.status.NOT_FOUND) {
                    console.error(err.details);
                } else {
                    console.error('Error finding recipe:', err);
                }
                return;
            }

            console.log('Found a recipe:');
            console.log(recipe);
            console.log('Processing...');
            const call = processingStub.process({ orderId, recipeId: recipe.id });
            call.on('data', (statusUpdate) => {
                statusUpdate = getStatusName(statusUpdate.status)
                console.log({ "status": statusUpdate });
            });
            call.on('end', () => {
                console.log('Processing done.');
            });

        });
    }
}

// STATIC DATA
{
    let id = 100;
    let orderId = 1;

    recipesStub.findRecipe({ id }, function (err, recipe) {
        if (err) {
            if (err.code === grpc.status.NOT_FOUND) {
                console.error(err.details);
            } else {
                console.error('Error finding recipe:', err);
            }
            return;
        }

        console.log('Found a recipe:');
        console.log(recipe);
        console.log('Processing...');
        const call = processingStub.process({ orderId, recipeId: recipe.id });
        call.on('data', (statusUpdate) => {
            statusUpdate = getStatusName(statusUpdate.status)
            console.log({ "status": statusUpdate });
        });
        call.on('end', () => {
            console.log('Processing done.');
        });

    });
}

app.post('/find/recipe', async (req, res) => {
    let { productid, orderid } = req.body; // Corrected spelling of 'productId'

    if (!productid || !orderid) {
        return res.status(400).json({ error: 'Bad Request', message: 'Please provide productId and orderId' });
    }

    let data = [];

    try {
        recipesStub.findRecipe({ id: productid }, (err, recipe) => {
            if (err) {
                console.error('Error finding recipe:', err.details);
                return res.status(500).json({ error: 'Internal Server Error', message: err.details });
            }

            console.log('Found a recipe:', recipe);
            data.push(recipe);

            console.log('Processing...');
            const call = processingStub.process({ orderid, recipeId: recipe.id });

            call.on('data', (statusUpdate) => {
                statusUpdate = getStatusName(statusUpdate.status);
                data.push({ status: statusUpdate });
            });

            call.on('end', () => {
                console.log('Processing done.');
                res.status(200).json({ data });
            });
        });
    } catch (error) {
        console.error('Error in gRPC call:', error);
        res.status(500).json({ error: 'Internal Server Error', message: 'Error in gRPC call' });
    }
});

function getStatusName(status) {
    switch (status) {
        case 1: return 'NEW';
        case 2: return 'QUEUED';
        case 3: return 'PROCESSING';
        case 4: return 'DONE';
        default: return 'UNKNOWN';
    }
}

app.listen(3000, () => console.log('Server is running on port 3000'));