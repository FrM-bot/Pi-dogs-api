const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('Temperaments', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        temperament: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }

    }, {
        timestamps: false
    })
}