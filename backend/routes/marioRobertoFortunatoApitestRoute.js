const express = require("express");
const {
  getProjectContractInfo
} = require("../controllers/marioRobertoFortunatoApitestController");

const router = express.Router();

router.route("/project-contract").post(getProjectContractInfo);

module.exports = router;