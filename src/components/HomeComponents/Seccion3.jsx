/* eslint-disable react/prop-types */
import { useState } from "react";
import { Box, Grid, Stack, Typography, useMediaQuery } from "@mui/material";

const CardContinent = ({ image, title, onClick }) => {
  return (
    <Stack
      className="card-continent"
      style={{ backgroundImage: `url(${image})` }}
      title={title}
      onClick={onClick}
    >
        <Box className="card-continent-overlay">
            <Typography className="card-continent-title">{title}</Typography>
        </Box>
     
    </Stack>
  );
};

const CardDestination = ({ image, title }) => {
  return (
    <Stack className="card-destination" alignItems="center" justifyContent="center" style={{ backgroundImage: `url(${image})` }}>

      <Box className="card-continent-overlay">
      <Typography className="card-destination-title">{title}</Typography>
        </Box>
    </Stack>
  );
};
const Seccion3 = ({ id }) => {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const continents = [
    {
      id: 1,
      image: "/images/continents/AMERICA.jpg",
      title: "America",
      destinations: [
        {
          id: 1,
          image: "/images/america/AMERICA1.jpg",
          title: "America 1",
        },
        {
          id: 2,
          image: "/images/america/AMERICA2.jpg",
          title: "America 2",
        },
        {
          id: 3,
          image: "/images/america/AMERICA3.jpg",
          title: "America 3",
        },
        {
          id: 4,
          image: "/images/america/AMERICA4.jpg",
          title: "America 4",
        },
        {
          id: 5,
          image: "/images/america/AMERICA5.jpg",
          title: "America 5",
        },
        {
          id: 6,
          image: "/images/america/AMERICA6.jpg",
          title: "America 6",
        },
        {
          id: 7,
          image: "/images/america/AMERICA7.jpg",
          title: "America 7",
        },
        {
          id: 8,
          image: "/images/america/AMERICA8.jpg",
          title: "America 8",
        },
        {
          id: 9,
          image: "/images/america/AMERICA9.jpg",
          title: "America 9",
        },
        {
          id: 10,
          image: "/images/america/AMERICA10.jpg",
          title: "America 10",
        },
        {
          id: 11,
          image: "/images/america/AMERICA11.jpg",
          title: "America 11",
        },
        {
          id: 12,
          image: "/images/america/AMERICA12.jpg",
          title: "America 12",
        },
        {
          id: 13,
          image: "/images/america/AMERICA13.jpg",
          title: "America 13",
        },
        {
          id: 14,
          image: "/images/america/AMERICA14.jpg",
          title: "America 14",
        },
      ]
    },
    {
      id: 2,
      image: "/images/continents/EUROPA.jpg",
      title: "Europa",
      destinations: [
        {
          id: 1,
          image: "/images/europa/EUROPA1.jpg",
          title: "Europa 1",
        },
        {
          id: 2,
          image: "/images/europa/EUROPA2.jpg",
          title: "Europa 2",
        },
        {
          id: 3,
          image: "/images/europa/EUROPA3.jpg",
          title: "Europa 3",
        },
        {
          id: 4,
          image: "/images/europa/EUROPA4.jpg",
          title: "Europa 4",
        },
        {
          id: 5,
          image: "/images/europa/EUROPA5.jpg",
          title: "Europa 5",
        },
        {
          id: 6,
          image: "/images/europa/EUROPA6.jpg",
          title: "Europa 6",
        },
        {
          id: 7,
          image: "/images/europa/EUROPA7.jpg",
          title: "Europa 7",
        },
        {
          id: 8,
          image: "/images/europa/EUROPA8.jpg",
          title: "Europa 8",
        },
        {
          id: 9,
          image: "/images/europa/EUROPA9.jpg",
          title: "Europa 9",
        },
        {
          id: 10,
          image: "/images/europa/EUROPA10.jpg",
          title: "Europa 10",
        },
        {
          id: 11,
          image: "/images/europa/EUROPA11.jpg",
          title: "Europa 11",
        },
        {
          id: 12,
          image: "/images/europa/EUROPA12.jpg",
          title: "Europa 12",
        },
        {
          id: 13,
          image: "/images/europa/EUROPA13.jpg",
          title: "Europa 13",
        },
        {
          id: 14,
          image: "/images/europa/EUROPA14.jpg",
          title: "Europa 14",
        },
        {
          id: 15,
          image: "/images/europa/EUROPA15.jpg",
          title: "Europa 15",
        },
        {
          id: 16,
          image: "/images/europa/EUROPA16.jpg",
          title: "Europa 16",
        },
        {
          id: 17,
          image: "/images/europa/EUROPA17.jpg",
          title: "Europa 17",
        },
        {
          id: 18,
          image: "/images/europa/EUROPA18.jpg",
          title: "Europa 18",
        },
        {
          id: 19,
          image: "/images/europa/EUROPA19.jpg",
          title: "Europa 19",
        },
        {
          id: 20,
          image: "/images/europa/EUROPA20.jpg",
          title: "Europa 20",
        },
        {
          id: 21,
          image: "/images/europa/EUROPA21.jpg",
          title: "Europa 21",
        },
        {
          id: 22,
          image: "/images/europa/EUROPA22.jpg",
          title: "Europa 22",
        },
        {
          id: 23,
          image: "/images/europa/EUROPA23.jpg",
          title: "Europa 23",
        },
        {
          id: 24,
          image: "/images/europa/EUROPA24.jpg",
          title: "Europa 24",
        },
        {
          id: 25,
          image: "/images/europa/EUROPA25.jpg",
          title: "Europa 25",
        },
        {
          id: 26,
          image: "/images/europa/EUROPA26.jpg",
          title: "Europa 26",
        },
        {
          id: 27,
          image: "/images/europa/EUROPA27.jpg",
          title: "Europa 27",
        },
        {
          id: 28,
          image: "/images/europa/EUROPA28.jpg",
          title: "Europa 28",
        },
        {
          id: 29,
          image: "/images/europa/EUROPA29.jpg",
          title: "Europa 29",
        },
        {
          id: 30,
          image: "/images/europa/EUROPA30.jpg",
          title: "Europa 30",
        },
        {
          id: 31,
          image: "/images/europa/EUROPA31.jpg",
          title: "Europa 31",
        },
        {
          id: 32,
          image: "/images/europa/EUROPA32.jpg",
          title: "Europa 32",
        },
        {
          id: 33,
          image: "/images/europa/EUROPA33.jpg",
          title: "Europa 33",
        },
        {
          id: 34,
          image: "/images/europa/EUROPA34.jpg",
          title: "Europa 34",
        },
        {
          id: 35,
          image: "/images/europa/EUROPA35.jpg",
          title: "Europa 35",
        },
        {
          id: 36,
          image: "/images/europa/EUROPA36.jpg",
          title: "Europa 36",
        },
      ],
    },
    {
      id: 3,
      image: "/images/africa/AFRICA4.jpg",
      title: "Africa",
      destinations: [
        {
          id: 1,
          image: "/images/africa/AFRICA1.jpg",
          title: "Africa 1",
        },
        {
          id: 2,
          image: "/images/africa/AFRICA2.jpg",
          title: "Africa 2",
        },
        {
          id: 3,
          image: "/images/africa/AFRICA3.jpg",
          title: "Africa 3",
        },
        {
          id: 4,
          image: "/images/africa/AFRICA4.jpg",
          title: "Africa 4",
        },
        {
          id: 5,
          image: "/images/africa/AFRICA5.jpg",
          title: "Africa 5",
        },
        {
          id: 6,
          image: "/images/africa/AFRICA6.jpg",
          title: "Africa 6",
        },
        {
          id: 7,
          image: "/images/africa/AFRICA7.jpg",
          title: "Africa 7",
        },
      ],
    },
    {
      id: 4,
      image: "/images/continents/ASIAyOCEANIA.jpg",
      title: "Asia y Oceania",
      destinations: [
        {
          id: 1,
          image: "/images/asia/ASIA1.jpg",
          title: "Asia 1",
        },
        {
          id: 2,
          image: "/images/asia/ASIA2.jpg",
          title: "Asia 2",
        },
        {
          id: 3,
          image: "/images/asia/ASIA3.jpg",
          title: "Asia 3",
        },
        {
          id: 4,
          image: "/images/asia/ASIA4.jpg",
          title: "Asia 4",
        },
        {
          id: 5,
          image: "/images/asia/ASIA5.jpg",
          title: "Asia 5",
        },
        {
          id: 6,
          image: "/images/asia/ASIA6.jpg",
          title: "Asia 6",
        },
        {
          id: 7,
          image: "/images/asia/ASIA7.jpg",
          title: "Asia 7",
        },
        {
          id: 8,
          image: "/images/asia/ASIA8.jpg",
          title: "Asia 8",
        },
        {
          id: 9,
          image: "/images/asia/ASIA9.jpg",
          title: "Asia 9",
        },
        {
          id: 10,
          image: "/images/asia/ASIA10.jpg",
          title: "Asia 10",
        },
        {
          id: 11,
          image: "/images/asia/ASIA11.png",
          title: "Asia 11",
        },
      ],
    },
  ];
  const [selectedContinentId, setSelectedContinentId] = useState(null);
  const selectedContinent = continents.find((continent) => continent.id === selectedContinentId);
  const continentRows = isMobile
    ? continents.map((c) => [c])
    : [continents];

  return (
    <Stack id={id} direction="column" alignItems="center" justifyContent="center" spacing={4} style={{paddingBottom: "4rem", backgroundColor: "#000"}}>
      <Typography className="seccion3-title">Destinos</Typography>
      <Stack direction="column" spacing={2} alignItems="center" justifyContent="center" style={{width: "80%"}}>
        {continentRows.map((row, rowIdx) => (
          <Stack
            key={rowIdx}
            className="seccion3-row"
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            {row.map((continent) => (
              <CardContinent
                key={continent.id}
                image={continent.image}
                title={continent.title}
                onClick={() =>
                  setSelectedContinentId((prevId) =>
                    prevId === continent.id ? null : continent.id
                  )
                }
              />
            ))}
          </Stack>
        ))}
      </Stack>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ width: "80%", paddingRight: "16px" }}
      >
        {selectedContinent?.destinations?.map((destination) => (
          <Grid className="card-destination-grid"
            item
            key={`${selectedContinent.id}-${destination.id}`}
            xs={12}
            sm={6}
            md={4}
            lg={3}
          >
            <CardDestination image={destination.image} title={destination.title} />
          </Grid>
        ))}
      </Grid>

    </Stack>
  );
};

export default Seccion3;
