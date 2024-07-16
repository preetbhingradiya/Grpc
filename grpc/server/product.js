const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Product = require('../model/product-model');
const connectDB = require('../config/db');

const PROTO_PATH = path.resolve(__dirname, "../protos/pro.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const productProto = grpc.loadPackageDefinition(packageDefinition).ecommerce.ProductService;

const server = new grpc.Server();

server.addService(productProto.service, {
    CreateProduct: async (call, callback) => {
        const { name, description, price, stock } = call.request;
        try {
            const product = await Product.create({
                id: uuidv4(),
                name,
                description,
                price,
                stock
            });
            callback(null, product);
        } catch (error) {
            console.error('Error creating product:', error);
            callback({
                code: grpc.status.INTERNAL,
                details: 'Error creating product',
            });
        }
    },

    GetAllProducts: async (_, callback) => {
        try {
            const products = await Product.find({})
            if (products.length == 0) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No products found',
                });
                return;
            }
            callback(null, { products });
        } catch (error) {
            console.error('Error getting products:', error);
            callback({
                code: grpc.status.INTERNAL,
                details: 'Error getting products',
            });
        }
    },

    UpdateProduct: async (call, callback) => {
        try {
            const { id, name, description, price, stock } = call.request;

            let product = await Product.findById(id);
            if (!product) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No products found',
                });
                return;
            }

            product.name = name == '' ? product.name : name;
            product.description == '' ? product.description : description;
            product.price = price == '' ? product.price : price;
            product.stock = stock == '' ? product.stock : stock;

            await product.save();

            callback(null, product);
        } catch (error) {
            console.error('Error updating product:', error);
            callback({
                code: grpc.status.INTERNAL,
                details: 'Error updating product',
            });
        }
    },

    GetProduct: async (call, callback) => {
        try {
            let { id } = call.request
            let product = await Product.findById(id);

            if (!product) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No products found',
                });
                return;
            }

            callback(null, product);
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: 'Error updating product',
            });
        }
    },

    DeleteProduct: async (call, callback) => {
        try {
            let { id } = call.request
            let product = await Product.findById(id);

            if (!product) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No products found',
                });
                return;
            }

            await product.deleteOne()

            callback(null, {});
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: 'Error updating product',
            });
        }
    }
});

const PORT = 5000;
const HOST = 'localhost';

connectDB().then(() => {
    server.bindAsync(`${HOST}:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
        console.log(`gRPC Server running at ${HOST}:${PORT}`);
        // server.start();
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});
