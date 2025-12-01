/* module.exports = {
   entry: "./index.js", // Входной файл, где пишем свой код
   output: {
      filename: "main.js" // Выходной файл, который подключаем к HTML
      // Сохранится он по пути "./dist/main.js"
   }
} */



   const path = require('path');

module.exports = {
  mode: 'development', // Или 'production' для production билда
  entry: './index.js', // Входной файл
  output: {
    filename: 'main.js', // Выходной файл
    path: path.resolve(__dirname, 'dist'), // Папка для выходного файла
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  devtool: 'inline-source-map', // Для отладки
};
