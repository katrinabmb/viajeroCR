import Swal from 'sweetalert2'

export async function confirmDanger({
  title,
  text,
  confirmButtonText = 'Eliminar',
  cancelButtonText = 'Cancelar',
}) {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: '#0f172a',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
    focusCancel: true,
  })

  return result.isConfirmed
}

export async function toastSuccess(message) {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  })
}

export async function toastError(message) {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'error',
    title: message,
    showConfirmButton: false,
    timer: 2400,
    timerProgressBar: true,
  })
}

