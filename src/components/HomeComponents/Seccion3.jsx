/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { Box, Dialog, Grid, IconButton, Stack, Typography, useMediaQuery } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import CloseIcon from '@mui/icons-material/Close'
import { fetchSeccion3Data } from '../../store/seccion3Slice'

const CardContinent = ({ image, title, onClick }) => (
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
)

const CardDestination = ({ image, title, onClick }) => (
  <Stack
    className="card-destination"
    alignItems="center"
    justifyContent="center"
    style={{ backgroundImage: `url(${image})`, cursor: 'pointer' }}
    title={title}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick?.(e)
    }}
  >
    <Box className="card-destination-overlay">
      <Typography className="card-destination-title">{title}</Typography>
    </Box>
  </Stack>
)

const Seccion3 = ({ id }) => {
  const isMobile = useMediaQuery('(max-width: 600px)')
  const dispatch = useDispatch()
  const title = useSelector((state) => state.seccion3.title)
  const continents = useSelector((state) => state.seccion3.continents)
  const [selectedContinentId, setSelectedContinentId] = useState(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [dialogImageSrc, setDialogImageSrc] = useState(null)

  useEffect(() => {
    dispatch(fetchSeccion3Data())
  }, [dispatch])

  useEffect(() => {
    if (!continents.length) {
      setSelectedContinentId(null)
    }
  }, [continents, selectedContinentId])

  if (!Array.isArray(continents) || continents.length === 0) {
    return null
  }

  const selectedContinent = continents.find((continent) => continent.id === selectedContinentId) ?? null
  const continentRows = isMobile ? continents.map((continent) => [continent]) : [continents]

  const handleOpenImageDialog = (imageSrc) => {
    setDialogImageSrc(imageSrc)
    setIsImageDialogOpen(true)
  }

  const handleCloseImageDialog = () => {
    setIsImageDialogOpen(false)
    setDialogImageSrc(null)
  }

  return (
    <Stack id={id} direction="column" alignItems="center" justifyContent="center" spacing={4} style={{ paddingBottom: '4rem', backgroundColor: '#000' }}>
      <Typography className="seccion3-title">{title}</Typography>
      <Stack direction="column" spacing={2} alignItems="center" justifyContent="center" style={{ width: '80%' }}>
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
                  setSelectedContinentId((prevId) => (prevId === continent.id ? null : continent.id))
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
        sx={{ width: '80%', paddingRight: '16px' }}
      >
        {selectedContinent?.destinations?.map((destination) => (
          <Grid
            className="card-destination-grid"
            item
            key={`${selectedContinent.id}-${destination.id}`}
            xs={12}
            sm={6}
            md={4}
            lg={3}
          >
            <CardDestination
              image={destination.image}
              title={destination.title}
              onClick={() => handleOpenImageDialog(destination.image)}
            />
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={isImageDialogOpen}
        onClose={handleCloseImageDialog}
        maxWidth={false}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden',
          },
        }}
      >
        {dialogImageSrc ? (
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={handleCloseImageDialog}
              aria-label="Cerrar"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: '#fff',
                backgroundColor: 'rgba(0,0,0,0.45)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' },
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box
              component="img"
              src={dialogImageSrc}
              alt=""
              sx={{
                display: 'block',
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />
          </Box>
        ) : null}
      </Dialog>
    </Stack>
  )
}

export default Seccion3
