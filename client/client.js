const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.resolve(__dirname, "../protos/product.proto");

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

const packageDefinition = protoLoader.loadSync(PROTO_PATH, options);
const productProto =
  grpc.loadPackageDefinition(packageDefinition).ProductService;

const client = new productProto(
  "localhost:5000",
  grpc.credentials.createInsecure()
);

const newProduct = {
  name: "New Product",
  description: "New Product Description",
  price: 100,
  stock: 50,
};

client.createProduct(newProduct, (error, response) => {
  if (error) {
    console.error("Error creating product:", error);
    return;
  }
  console.log("Created Product:", response);
});

client.getAllProducts({}, (error, response) => {
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }
  console.log("Products:", response.products);
});

module.exports = client