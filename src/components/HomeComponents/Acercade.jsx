import { Stack, Typography, useMediaQuery } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAcercadeData } from '../../store/acercadeSlice'

const Acercade = ({ id }) => {
  const isMobile = useMediaQuery('(max-width: 600px)')
  const dispatch = useDispatch()
  const title = useSelector((state) => state.acercade.title)
  const image = useSelector((state) => state.acercade.image)
  const paragraph1 = useSelector((state) => state.acercade.paragraph_1)
  const paragraph2 = useSelector((state) => state.acercade.paragraph_2)

  useEffect(() => {
    dispatch(fetchAcercadeData())
  }, [dispatch])

  return (
    <Stack
      id={id}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={4}
      style={{ paddingBottom: '4rem', backgroundColor: '#000', borderBottom: '2px solid #C39D65', paddingTop: isMobile ? '1rem' : '2rem' }}
    >
      <Typography className="seccion3-title">{title}</Typography>

      <Stack direction={isMobile ? 'column' : 'row'} alignItems="center" justifyContent="center" spacing={isMobile ? 4 : 18}>
        <img src={image} alt="Viajero CR" className="acercade-image" />

        <Stack direction="column" alignItems="center" justifyContent="center" spacing={2} style={{ width: isMobile ? '80%' : '40%' }}>
          <Typography className="acercade-descripcion">{paragraph1}</Typography>
          <Typography className="acercade-descripcion">{paragraph2}</Typography>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default Acercade

