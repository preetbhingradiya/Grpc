const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Define the path to your .proto file
const PROTO_PATH = path.resolve(__dirname + '/protos/product.proto');
console.log(PROTO_PATH);

// Load gRPC package definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const productProto = grpc.loadPackageDefinition(packageDefinition).ProductService;

// Create gRPC client
const client = new productProto(
  'localhost:5000', // gRPC server address
  grpc.credentials.createInsecure()
);

// Initialize Express app
const app = express();
app.use(express.json());

// Define API endpoints that call gRPC services

app.get('/products', (req, res) => {
  client.getAllProducts({}, (error, response) => {
    if (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
      return;
    }
    res.json(response.products);
  });
});

app.post('/products', (req, res) => {
  const product = req.body;
  client.createProduct(product, (error, response) => {
    if (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
      return;
    }
    res.status(201).json(response);
  });
});

app.delete('/products/:id', (req, res) => {
  const id = req.params.id;
  client.deleteProduct({ id: id.toString() }, (error, response) => {
    if (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
      return;
    }
    res.status(204).send(); // No content
  });
});

app.get('/products/:id', (req, res) => {
  const id = req.params.id;
  client.getProductById({ id: id.toString() }, (error, response) => {
    if (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
      return;
    }
    res.json(response);
  });
});

// Start the Express server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});
