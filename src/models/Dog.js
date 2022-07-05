const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = sequelize => {
  // defino el modelo
  sequelize.define('Dog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    image: {
      type: DataTypes.STRING,
      // allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      /* A validation that the field is not null. */
      // allowNull: false,
    },
    bred_for: {
      type: DataTypes.STRING,
    },
    breed_group: {
      type: DataTypes.STRING,
    },
    height_min: {
      type: DataTypes.FLOAT,
      // allowNull: false,\
      defaultValue: 0
    },
    weight_min: {
      type: DataTypes.FLOAT,
      // allowNull: false,
      defaultValue: 0
    },
    height_max: {
      type: DataTypes.FLOAT,
      // allowNull: false,
      defaultValue: 0
    },
    weight_max: {
      type: DataTypes.FLOAT,
      // allowNull: false,
      defaultValue: 0
    },
    life_span_min: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
  }, {
    timestamps: false
  });
};
