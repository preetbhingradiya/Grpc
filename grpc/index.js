const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const bodyParser = require('body-parser');
const connect = require('./config/db');

const app = express();
const PORT = 3000;

const PROTO_PATH = path.resolve(__dirname, './protos/pro.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const ProductService = grpc.loadPackageDefinition(packageDefinition).ecommerce.ProductService;

const client = new ProductService('localhost:5000', grpc.credentials.createInsecure());

app.use(bodyParser.json());

app.post('/products', (req, res) => {
  const { name, description, price, stock } = req.body;
  client.CreateProduct({ name, description, price, stock }, (error, response) => {
    if (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
      return;
    }

    res.status(201).json(response);
  });
});

app.get('/products', (req, res) => {
  client.GetAllProducts({}, (error, response) => {
    if (error) {
      if (error.code === grpc.status.NOT_FOUND) {
        res.status(404).json({ error: 'No products found' });
      } else {
        res.status(500).json({ error: 'Failed to fetch products' });
      }
      return;
    }

    res.status(200).json(response.products);
  });
})

app.patch('/edit/product/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;

  client.UpdateProduct({ id, name, description, price, stock }, (error, response) => {
    if (error) {
      if (error.code === grpc.status.NOT_FOUND) {
        res.status(404).json({ error: 'Product not found' });
      } else {
        res.status(500).json({ error: 'Failed to update product' });
      }
      return;
    }

    res.status(200).json(response);
  });
})

app.get('/product/:id', (req, res) => {
  const { id } = req.params;

  client.GetProduct({ id }, (error, response) => {
    if (error) {
      if (error.code === grpc.status.NOT_FOUND) {
        res.status(404).json({ error: 'Product not found' });
      } else {
        res.status(500).json({ error: 'Failed to fetch product' });
      }
      return;
    }

    res.status(200).json(response);
  });
})

app.delete('/delete/product/:id', (req, res) => {
  const { id } = req.params;
  client.DeleteProduct({ id }, (error, response) => {
    if (error) {
      if (error.code === grpc.status.NOT_FOUND) {
        res.status(404).json({ error: 'Product not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete product' });
      }
      return;
    }
    res.status(200).json({ message: "Product deleted successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
  // connect()
});