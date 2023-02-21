import React from "react";
import ReactDOM from "react-dom";
import DeckGL, { S2Layer } from "deck.gl";
import { StaticMap } from "react-map-gl";
import long from "long";
import { S2 } from "s2-geometry";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZ2Vvcmdpb3MtdWJlciIsImEiOiJjanZidTZzczAwajMxNGVwOGZrd2E5NG90In0.gdsRu_UeU_uPi9IulBruXA";

const TOOLBOX_STYLES = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  display: "flex",
  flexFlow: "column"
};

const initialViewState = {
  longitude: -40,
  latitude: 30,
  zoom: 1
};

const EXAMPLE_S2_IDS = [
  // NW California using long id
  "6111455063085940736",
  // Denver using long id
  "-8688701543974699008",
  // Downtown San Francisco using quad tree key
  "4/00101323331003",
  // Downtown San Francisco using full hex id
  "0x808f7ddf00000000",
  // Downtown San Francisco using s2 token (abbreviated hex)
  "0x808f7ddd"
].join(",");

function getCellDetails(cellId) {
  const id = cellId.toString();
  // $FlowFixMe - toString takes arguments (see https://www.npmjs.com/package/long)
  const hexId = cellId.toString(16);
  const key = S2.idToKey(id);
  const level = key.split("/")[1].length;
  return {
    id,
    hexId,
    key,
    level
  };
}

function App() {
  const [s2Ids, setS2Ids] = React.useState(EXAMPLE_S2_IDS);

  const s2IdsParsed = React.useMemo(
    () =>
      s2Ids
        .split(",")
        .filter(Boolean)
        .map((idString) => {
          try {
            let token;
            if (idString.startsWith("0x")) {
              const fullHexId = idString.padEnd(18, "0");
              // Parse hex id
              token = long.fromString(fullHexId, false, 16);
            } else if (idString.indexOf("/") !== -1) {
              // Parse quad key
              const [face, position] = idString.split("/");
              const level = position.length;

              var cellId = S2.facePosLevelToId(face, position, level);
              token = long.fromString(cellId);
            } else {
              token = long.fromString(idString);
            }
            return { token };
          } catch (err) {
            console.error(err);
          }
          return null;
        })
        .filter(Boolean),
    [s2Ids]
  );

  const layers = [
    new S2Layer({
      data: s2IdsParsed,
      pickable: true,
      stroked: true,
      autoHighlight: true,
      getFillColor: [100, 100, 100],
      getLineColor: [0, 0, 0],
      lineWidthUnits: "pixels",
      getLineWidth: 3,
      opacity: 0.5
    })
  ];

  return (
    <>
      <DeckGL
        initialViewState={initialViewState}
        layers={layers}
        controller={true}
        getTooltip={({ object }) => {
          if (object && object.token) {
            return JSON.stringify(getCellDetails(object.token), null, 2);
          }
          return null;
        }}
        onClick={({ object }) => {
          if (object && object.token) {
            console.log(getCellDetails(object.token), null, 2);
          }
        }}
      >
        <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} />
      </DeckGL>
      <div style={TOOLBOX_STYLES}>
        <label>Enter s2 cell ids (comma-delimited):</label>
        <input
          type="text"
          placeholder={EXAMPLE_S2_IDS}
          value={s2Ids}
          onChange={({ target }) => setS2Ids(target.value)}
        />
      </div>
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
