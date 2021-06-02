const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const x = `SELECT *
      FROM state;

   `;
  const ram = await db.all(x);
  response.send(
    ram.map((eachState) => convertStateDbObjectToResponseObject(eachState))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const sh = `SELECT *
           FROM state
           where state_id=${stateId};  
    `;
  const sx = await db.get(sh);
  response.send(convertStateDbObjectToResponseObject(sx));
});

app.post("/districts/", async (request, response) => {
  const ra = request.body;

  const { districtName, stateId, cases, cured, active, deaths } = ra;

  const ab = `
    INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    `;
  const xy = await db.run(ab);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const sm = `SELECT *
           FROM district
           where district_id=${districtId};  
    `;
  const sa = await db.get(sm);
  response.send(convertDistrictDbObjectToResponseObject(sa));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const de = `DELETE FROM
      district
      WHERE district_id=${districtId};
     `;
  await db.run(de);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dg = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = dg;
  const df = ` UPDATE district 
     
      SET 
         district_name='${districtName}',
         state_id=${stateId},
         cases=${cases},
         cured=${cured},
         active=${active},
         deaths=${deaths}

    ;
     `;
  await db.run(df);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const ax = `SELECT SUM(cases),
    SUM(cured),SUM(active),
    SUM(deaths)
      FROM district
      WHERE state_id=${stateId};
    `;
  const stat = await db.get(ax);
  response.send({
    totalCases: stat["SUM(cases)"],
    totalCured: stat["SUM(cured)"],
    totalActive: stat["SUM(active)"],
    totalDeaths: stat["SUM(deaths)"],
  });
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const qu = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(qu);
  response.send({ stateName: state.state_name });
});

module.exports = app;
