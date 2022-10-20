'use strict'

// eslint-disable-next-line prettier/prettier
;
;(() => {
  // eslint-disable-next-line no-undef
  const { document } = window

  const closeFlashMsgBtns = document.querySelectorAll('.flash-msg .close-flash')
  const fileInput = document.querySelector('input[type="file"]')

  const modal = (() => {
    const overlayEl = document.querySelector('.overlay')
    const modalEl = document.querySelector('.msg-modal')
    const msgEl = modalEl.querySelector('.msg')
    const closeBtn = modalEl.querySelector('.close-modal')

    closeBtn.addEventListener('click', hide)
    overlayEl.addEventListener('click', hide)
    hide()

    function hide() {
      overlayEl.classList.add('hidden')
      modalEl.classList.add('hidden')
    }

    function show() {
      overlayEl.classList.remove('hidden')
      modalEl.classList.remove('hidden')
    }

    function showMsg(msg) {
      msgEl.textContent = msg
      show()
    }

    return {
      showMsg,
    }
  })()

  function removeFlash(e) {
    const flashMsgEl = e.target.closest('.flash-msg')
    flashMsgEl.remove()
  }

  closeFlashMsgBtns.forEach(btn => {
    btn.addEventListener('click', removeFlash)
  })

  fileInput?.addEventListener('change', () => {
    const MAX_UPLOAD_SIZE_Byte = Number(fileInput.dataset.maxSize)
    const { size } = fileInput.files[0]
    if (size <= MAX_UPLOAD_SIZE_Byte) return

    fileInput.value = ''
    const fileKB = Math.round(size / 1024)
    const maxKB = Math.round(MAX_UPLOAD_SIZE_Byte / 1024)

    modal.showMsg(`File is too big!, ${fileKB}KB greater than ${maxKB}KB`)
  })
})()
