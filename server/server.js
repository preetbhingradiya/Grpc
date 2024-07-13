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

const server = new grpc.Server();

let products = [
  { id: 1, name: "Note 1", discription: "Content 1", price: 11, stock: 9 },
  { id: 2, name: "Note 2", discription: "Content 2", price: 12, stock: 10 },
];

server.addService(productProto.service, {
  getAllProducts: (_, callback) => {
    callback(null, { products: products });
  },
  createProduct: (call, callback) => {
    const product = call.request;
    product.id = products.length + 1;
    products.push(product);
    callback(null, product);
  },
  deleteProduct: (call,callback)=>{
    const id = parseInt(call.request.id)
    products = products.filter(product => product.id !== id)
    callback(null , {})
  },
  editProduct: (call , callback)=>{
    const productId = call.request.id
    const productItem = products.filter(product => product.id == productId)
    productItem[0].name = call.request.name
    productItem[0].discription = call.request.discription
    productItem[0].price = call.request.price
    productItem[0].stock = call.request.stock
    callback(null , productItem)
  }
});

const PORT = 5000;
const HOST = "127.0.0.1";

server.bindAsync(
  `${HOST}:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error("Server bind failed:", error);
    } else {
      console.log(`Server running at http://${HOST}:${port}`);
      server.start();
    }
  }
);
