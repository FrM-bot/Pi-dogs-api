//                       _oo0oo_
//                      o8888888o
//                      88" . "88
//                      (| -_- |)
//                      0\  =  /0
//                    ___/`---'\___
//                  .' \\|     |// '.
//                 / \\|||  :  |||// \
//                / _||||| -:- |||||- \
//               |   | \\\  -  /// |   |
//               | \_|  ''\---/''  |_/ |
//               \  .-\__  '-'  ___/-. /
//             ___'. .'  /--.--\  `. .'___
//          ."" '<  `.___\_<|>_/___.' >' "".
//         | | :  `- \`.;`\ _ /`;.`/ - ` : | |
//         \  \ `_.   \_ __\ /__ _/   .-` /  /
//     =====`-.____`.___ \_____/___.-`___.-'=====
//                       `=---='
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const server = require('./app.js');
const { sequelize, Dog, Temperaments } = require('./db.js');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3001
// Syncing all the models at once.
const start = async () => {
  const config = process.env.NODE_ENV !== 'development' ? { alter: true } : { force: true, alter: true }

  await sequelize.sync(config)

  const dogsSQL = await Dog.findAll({ include: Temperaments });
  
  
  if (dogsSQL.length === 0) {
    const dogs = await fetch('https://api.thedogapi.com/v1/breeds')
    const dogsJson = await dogs.json()
    const dogsTempearments = dogsJson.filter(dog => dog.temperament?.length > 0).map(dog => dog.temperament.split(', ')).flat(1)
    const dogsTempearmentsUnique = [...new Set(dogsTempearments)]
    const dataToInsert = dogsTempearmentsUnique.map(temperament => ({ temperament }))
    await Temperaments.bulkCreate(dataToInsert)
    const dogsMaped = dogsJson?.map((dog) => ({
        // id: dog.id,
        name: dog.name.toLowerCase(),
        height_min: Number(dog?.height?.metric?.split('-')[0]) || 1,
        weight_min: Number(dog?.weight?.metric?.split('-')[0]) || 1,
        height_max: Number(dog?.height?.metric?.split('-')[1]) || 1,
        weight_max: Number(dog?.weight?.metric?.split('-')[1]) || 1,
        life_span_min: Number(dog?.life_span?.split('-')[0]) || 1,
        bred_for: dog?.bred_for || '',
        breed_group: dog?.breed_group || '',
        image: `https://cdn2.thedogapi.com/images/${dog.reference_image_id}.jpg`
    }))
    const dogsCreated = await Dog.bulkCreate(dogsMaped)
    const temperaments = await Temperaments.findAll()
    const temperamentMap = temperaments?.map(({dataValues}) => dataValues)
    dogsCreated.forEach((dogCreated) => {
        const dogFind = dogsJson?.find(({ id }) => id === dogCreated.dataValues.id)
        const temperamentsIDs = dogFind?.temperament?.split(', ')?.map(temperamentDog => {
            const dog = temperamentMap?.find(({ temperament }) => temperament === temperamentDog)
            return dog?.id ?? 10
        })
        dogCreated.addTemperaments(temperamentsIDs)
    })
}
  server.listen(PORT, () => {
    console.log(`%s listening at http://localhost:${PORT}`, 'server'); // eslint-disable-line no-console
  });
  // Code here
}

start()
// sequelize.sync({ alter: true, force: true }).then(() => {
  
// });
