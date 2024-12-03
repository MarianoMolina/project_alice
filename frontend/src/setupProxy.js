const express = require('express');
const path = require('path');

module.exports = function (app) {
  app.use('/shared', express.static(path.join(__dirname, '../public/shared')));
};