// Middleware function
const myMiddleware = (req, res, next) => {
  console.log("executed the middleware");
  next();
};

export default myMiddleware;