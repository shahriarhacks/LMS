import app from "./app";
import config from "./config";
import connectDB from "./utils/db";

app.listen(config.PORT, () => {
  console.log(
    `Server is ready by PORT ${config.PORT} and url address http://127.0.0.1:${config.PORT}`
  );
  connectDB();
});
