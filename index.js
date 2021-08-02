const fs = require('fs/promises');
const axios = require('axios');
const _ = require('lodash');
const neatCsv = require('neat-csv');

const API_LIMIT = 50;
const CHUNK_LIMIT = 10;
const TIMEOUT = 10000;

const instance = axios.create({
  baseURL: 'https://shopee.vn/api/v2/',
  timeout: TIMEOUT,
});

const getProducts = async () => {
  const listText = await fs.readFile(
    'shopee_mattress.csv',
    'utf-8',
    (err, data) => data.toString(),
  );

  const list = await neatCsv(listText, {
    headers: ['productType', 'productDesc', 'productURL'],
    skipLines: 1,
  });
  const products = list.map((item) => {
    const regexID = /i\.(\d+)\.(\d+)/;
    const match = regexID.exec(item.productURL);
    return {
      ...item,
      shopId: match ? match[1] : null,
      itemId: match ? match[2] : null,
    };
  });
  return products;
};

const main = async () => {
  const products = await getProducts();
  const productsChunks = _.chunk(products, CHUNK_LIMIT);
  await Promise.all(
    productsChunks.map(async (chunk, i) => {
      const productsData = await Promise.all(
        chunk.map(async (product) => {
          if (product.itemId && product.shopId) {
            const rows = [];
            const limit = API_LIMIT;
            const params = {
              filter: 0,
              flag: 1,
              type: 0,
              itemid: product.itemId,
              shopid: product.shopId,
              limit,
              offset: 0,
            };
            while (true) {
              try {
                const { data } = await instance.get('item/get_ratings', {
                  params,
                });
                console.log(params);
                const { ratings } = data.data;
                if (ratings) {
                  rows.push(
                    ...ratings.map((rating) => ({
                      ...rating,
                      ...product,
                    })),
                  );
                  if (ratings.length > 0) {
                    params.offset += limit;
                  } else {
                    break;
                  }
                } else {
                  break;
                }
              } catch (error) {
                console.log(error);
                break;
              }
            }
            return rows;
          } else {
            return product;
          }
        }),
      );
      const flattenProductsData = _.flatten(productsData);
      await fs.writeFile(
        `exports/${i}.json`,
        JSON.stringify(flattenProductsData, null, 2),
        () => {},
      );
    }),
  );
};

main();
