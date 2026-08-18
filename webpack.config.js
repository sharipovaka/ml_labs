/**
 * Конфигурация Webpack 5 для SPA «Семинары по машинному обучению».
 *
 * Ключевые особенности:
 *  1. publicPath вычисляется из поля "homepage" в package.json, поэтому все
 *     статические ресурсы корректно грузятся из подпапки GitHub Pages
 *     (https://<user>.github.io/<repo>/).
 *  2. CSS-модули (*.module.css) и обычный CSS (Bootstrap, Font Awesome)
 *     обрабатываются разными правилами.
 *  3. HTML, сгенерированный из Jupyter Notebook, импортируется КАК СТРОКА
 *     (type: 'asset/source') и попадает в атрибут srcdoc тега <iframe>.
 *     Динамический import() выносит каждый ноутбук в отдельный чанк,
 *     чтобы не раздувать основной бандл.
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const pkg = require('./package.json');

const SRC = path.resolve(__dirname, 'src');
const CONTENT = path.resolve(SRC, 'content'); // сюда pandoc кладёт .html
const PUBLIC = path.resolve(__dirname, 'public');
const DIST = path.resolve(__dirname, 'dist');

/**
 * Путь, с которого браузер запрашивает ассеты.
 * Для GitHub Pages это подпапка репозитория: "/ml-seminars/".
 * Переопределяется переменной окружения PUBLIC_URL (удобно для CI).
 */
function resolvePublicPath(isProduction) {
  if (!isProduction) return '/';

  const raw = process.env.PUBLIC_URL || pkg.homepage || '/';
  let pathname;
  try {
    pathname = new URL(raw).pathname; // "https://user.github.io/repo/" -> "/repo/"
  } catch {
    pathname = raw; // уже относительный путь, например "/ml-seminars/"
  }
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

module.exports = (env = {}, argv = {}) => {
  const isProduction = argv.mode === 'production';
  const publicPath = resolvePublicPath(isProduction);

  return {
    mode: isProduction ? 'production' : 'development',
    entry: path.resolve(SRC, 'index.js'),
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',

    output: {
      path: DIST,
      publicPath,
      filename: isProduction
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/[name].js',
      chunkFilename: isProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[hash:8][ext]',
      clean: true,
    },

    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@': SRC,
        '@content': CONTENT,
      },
    },

    module: {
      rules: [
        // --- JS / JSX ---
        {
          test: /\.jsx?$/,
          include: SRC,
          use: {
            loader: 'babel-loader',
            options: { cacheDirectory: true },
          },
        },

        // --- CSS-модули: только файлы *.module.css ---
        {
          test: /\.module\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  localIdentName: isProduction
                    ? '[hash:base64:8]'
                    : '[name]__[local]',
                  namedExport: false,
                  exportLocalsConvention: 'camelCaseOnly',
                },
              },
            },
          ],
        },

        // --- Обычный CSS: глобальные стили, Bootstrap, Font Awesome ---
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },

        // --- HTML из Jupyter Notebook -> импортируется как строка ---
        // include ограничивает правило папкой src/content, чтобы шаблон
        // public/index.html продолжал обрабатываться HtmlWebpackPlugin.
        {
          test: /\.html$/,
          include: CONTENT,
          type: 'asset/source',
        },

        // --- Картинки и шрифты (в т.ч. webfonts Font Awesome) ---
        {
          test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: { filename: 'static/fonts/[name].[hash:8][ext]' },
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(PUBLIC, 'index.html'),
        // Иконку не передаём опцией favicon: файл и так копируется из public/
        // через CopyWebpackPlugin, а два плагина не могут писать один и тот же ассет.
        // <%= PUBLIC_URL %> в шаблоне заменяется на publicPath без завершающего слэша
        templateParameters: {
          PUBLIC_URL: publicPath.replace(/\/$/, ''),
        },
        minify: isProduction && {
          collapseWhitespace: true,
          removeComments: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
        },
      }),

      // Копируем manifest.json, иконки, robots.txt и исходные .ipynb
      new CopyWebpackPlugin({
        patterns: [
          {
            from: PUBLIC,
            to: DIST,
            // dot: true — чтобы скопировался .nojekyll (без него GitHub Pages
            // прогоняет сборку через Jekyll и игнорирует часть файлов)
            globOptions: { dot: true, ignore: ['**/index.html'] },
            noErrorOnMissing: true,
            // Подставляем реальный publicPath в manifest.json
            transform(content, absoluteFrom) {
              if (!absoluteFrom.endsWith('manifest.json')) return content;
              return Buffer.from(
                content.toString().replace(/%PUBLIC_URL%\/?/g, publicPath),
              );
            },
          },
          {
            // Исходные ноутбуки доступны для скачивания по ссылке «Скачать .ipynb»
            from: path.resolve(__dirname, 'notebooks'),
            to: path.resolve(DIST, 'notebooks'),
            globOptions: { ignore: ['**/.ipynb_checkpoints/**'] },
            noErrorOnMissing: true,
          },
        ],
      }),

      isProduction &&
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),
    ].filter(Boolean),

    optimization: {
      minimizer: ['...', new CssMinimizerPlugin()],
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          // Библиотеки (react, react-router, bootstrap) — в отдельный чанк
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'initial',
          },
        },
      },
    },

    performance: {
      // Ноутбуки с картинками в base64 весят много — это ожидаемо,
      // они грузятся отдельными чанками по требованию.
      hints: false,
    },

    devServer: {
      static: [
        { directory: PUBLIC },
        // Чтобы ссылка «Скачать .ipynb» работала и в dev-режиме
        {
          directory: path.resolve(__dirname, 'notebooks'),
          publicPath: '/notebooks',
        },
      ],
      port: 3000,
      open: true,
      hot: true,
      compress: true,
      // Нужно для React Router: любой путь отдаёт index.html
      historyApiFallback: true,
      client: { overlay: { errors: true, warnings: false } },
    },

    stats: 'errors-warnings',
  };
};
