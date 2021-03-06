const { Router } = require('express');
const fetch = require('node-fetch');
const { Dog, Temperaments } = require('../db')
const { Op } = require("sequelize");
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const router = Router();

router.get('/', (req, res) => {
    res.send('Server Dogs');
})


router.get('/dogs', async (req, res) => {
    try {   
        const { name: nameToSEarch, page, isAscendant, sortBy='name', filterBy } = req.query
        const isAscendantBool = isAscendant === 'true'
        const QUANTITY = 8
        const isAscDesc = isAscendantBool ? 'DESC' : 'ASC'
        const dogsPageNumber = Number(page) || 1
        const skip = (dogsPageNumber - 1) * QUANTITY

        if (filterBy) {

            const dogsF = await Temperaments.findAll({
                where: {
                  temperament: filterBy
                },
                include: {
                    model: Dog,
                    as: 'Dogs',
                },
            })
           


            const dogsToSend = dogsF?.map(({ dataValues }) => dataValues.Dogs).flat(1)
            const dogIDs = dogsToSend.map(({ dataValues }) => {
                return dataValues.id
            })



            const numberOfDogs = await Dog.count({
                where: {
                    [Op.and]: [
                        { 
                            id: dogIDs
                        },
                        { 
                            name: {
                                [Op.substring]: nameToSEarch
                            }
                        }
                    ]
                },
            })

            const dogsAndTemperaments = await Dog.findAll({
                include: {
                    model: Temperaments,
                },
                where: {
                    
                    [Op.and]: [
                        { 
                            id: dogIDs
                        },
                        { 
                            name: {
                                [Op.substring]: nameToSEarch
                            }
                        }
                    ]
                },
                order: [[sortBy, isAscDesc]],
                offset: skip,
                limit: QUANTITY
            })
            const dd = dogsAndTemperaments.map((dog) => {
            return {
                ...dog.dataValues,
                Temperaments: dog.dataValues.Temperaments.map(({ dataValues }) => dataValues.temperament)
            }
            
            })

            return res.status(200).json({data: dd, currentPage: dogsPageNumber, numberOfPages: Math.ceil(numberOfDogs/QUANTITY)});
        }

        if (nameToSEarch) {
            const dogsSearched = await Dog.findAll({
                where: {
                    name: {
                        [Op.substring]: nameToSEarch
                    }
                },
                order: [[sortBy, isAscDesc]],
                include: Temperaments,
                offset: skip, 
                limit: QUANTITY
             })
             const numberOfDogs = await Dog.count({
                where: {
                    name: {
                        [Op.substring]: nameToSEarch
                    }
                }
             })
             const dogsTosend = dogsSearched.map(({ dataValues }) => {
                return {
                    ...dataValues,
                    Temperaments: dataValues.Temperaments.map(({ dataValues }) => dataValues.temperament)
                }
             })

            return res.status(200).json({data: dogsTosend , currentPage: dogsPageNumber, numberOfPages: Math.ceil(numberOfDogs / QUANTITY)});
        }
        const dogsSQL = await Dog.findAll({ include: Temperaments, order: [[sortBy, isAscDesc]], offset: skip, limit: QUANTITY });
    
        const dataToSEnd = dogsSQL?.map(({dataValues}) => {
            const temperaments = dataValues.Temperaments?.map(({ temperament }) =>temperament)
            const { Temperaments, ...data  } = dataValues
            return {
                ...data,
                Temperaments: temperaments
            }
        })

        const numberOfDogs = await Dog.count({})
        res.status(200).json({data: dataToSEnd , currentPage: dogsPageNumber, numberOfPages: Math.ceil(numberOfDogs / QUANTITY)})
    } 
    catch (error) {
        throw new Error(error);
    }
})

router.post('/dogs', async (req, res) => {
    try {
        const dog = req.body;
 
        for (const property in dog) {
            if (!dog[property]) {
                return res.status(400).json({
                    message: `Missing parameters: ${property}`
                })    
            }
          }
        
        const {
            temperamentsIds,
            ...dogToAdd
        } = dog

        const newDog = await Dog.create(dogToAdd)
        await newDog.addTemperaments(temperamentsIds);
        const dogTemperaments = await newDog.getTemperaments();
        const temperaments = await dogTemperaments?.map(({id, temperament}) => {
            return {
                id,
                temperament
            }
        })
    
        res.status(201).json({ ...newDog.dataValues, Temperaments: temperaments })
    } catch (error) {
        throw new Error(error);
    }
})


router.get('/dogs/:id', async (req, res) => {

    const { id } = req.params;

    try {
        const dogDB = await Dog.findByPk(id, {
            include: Temperaments
        })
        const { Temperaments: temperaments,  ...dog } = dogDB.dataValues
        const temperamentsMaped = temperaments?.map(({ dataValues }) => {
            return dataValues.temperament
        })
        // dogDB.dataValues.Temperaments = temperaments
        // console.log(temperament, dog)
        res.status(200).json({ ...dog, Temperaments: temperamentsMaped })
    } catch (error) {
        return res.status(404).json({error: 'Dog not found'});
    }
})

router.get('/temperaments', async (req, res) => {
    try {
        const temperaments = await Temperaments.findAll();
        if (temperaments.length > 0) {
            return res.status(200).json(temperaments);    
        }

        const dogs = await fetch('https://api.thedogapi.com/v1/breeds')
        const dogsJson = await dogs.json()
        const dogsTempearments = dogsJson.filter(dog => dog.temperament?.length > 0).map(dog => dog.temperament.split(', ')).flat(1)
        const dogsTempearmentsUnique = [...new Set(dogsTempearments)]
        const dataToInsert = dogsTempearmentsUnique.map(temperament => ({ temperament }))
        const temperamentsDB = await Temperaments.bulkCreate(dataToInsert)
        res.status(200).json(temperamentsDB)
    } catch (error) {
        throw new Error(error);
    }
})

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

module.exports = router;
