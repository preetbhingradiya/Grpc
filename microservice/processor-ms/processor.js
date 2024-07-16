const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/processing.proto'))
const processingProto = grpc.loadPackageDefinition(packageDefinition).Processing


function Process(call) {
    let orderRequest = call.request;
    let time = orderRequest.orderId * 1000 + orderRequest.recipeId * 10;

    call.write({ status: 'QUEUED' });
    setTimeout(() => {
        call.write({ status: 'PROCESSING' });
        setTimeout(() => {
            call.write({ status: 'DONE' });
            call.end();
        }, time);
    }, time);
}


const server = new grpc.Server();
server.addService(processingProto.service, { Process });
server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), (err, port) => {
    console.log(`Server listening on port ${port}`)
    // server.start();
});