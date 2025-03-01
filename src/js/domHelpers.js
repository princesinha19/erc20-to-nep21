import {
  clear as clearTransfer,
  initiate as initiateTransfer,
  retry as retryTransfer
} from './transfers'
import render from './render'

// Update DOM elements that have a "data-behavior" attribute
// Given `<span data-behavior="thing"></span>`
// You can `fill('thing').with('whatever')` to set the innerHTML
export const fill = selector => ({
  with: content =>
    Array.from(document.querySelectorAll(`[data-behavior=${selector}]`))
      .forEach(n => {
        n.innerHTML = content
        if (n.className.match('clip')) {
          n.title = content
        }
      })
})

// Hide DOM elements that have the given "data-behavior" attribute
export const hide = selector =>
  Array.from(document.querySelectorAll(`[data-behavior=${selector}]`))
    .forEach(n => { n.style.display = 'none' })

// Hide DOM elements that have the given "data-behavior" attribute
export const show = (selector, display) =>
  Array.from(document.querySelectorAll(`[data-behavior=${selector}]`))
    .forEach(n => {
      if (display) {
        n.style.display = display
      } else {
        n.style.removeProperty('display')
      }
    })

// DOM handlers to be added once after page load
export const initDOMhandlers = () => {
  document.querySelector('[data-behavior=logout]').onclick = async function logout () {
    await window.web3Modal.clearCachedProvider()
    window.nearConnection.signOut()
    setTimeout(() => window.location.reload())
  }

  document.querySelectorAll('.dropdown').forEach(d => {
    document.querySelector('body').addEventListener('click', event => {
      const button = d.querySelector('button')
      const clickedButton = button.contains(event.target)
      const clickedInDropdown = d.contains(event.target)
      const classNames = Array.from(d.classList)
      const active = classNames.includes('active')

      if (!active) {
        if (clickedButton) {
          d.className = [...classNames, 'active'].join(' ')
        }
      } else {
        if (clickedButton || !clickedInDropdown) {
          d.className = classNames.filter(c => c !== 'active').join(' ')
        }
      }
    })
  })

  document.querySelector('input#amount').oninput = (event) => {
    const submitButton = document.querySelector('main form button')

    if (event.target.value > 0) {
      submitButton.disabled = false
    } else {
      submitButton.disabled = true
    }
  }

  document.querySelector('main form').onsubmit = async (event) => {
    event.preventDefault()

    // get elements from the form using their id attribute
    const { amount, fieldset, submit } = event.target.elements

    // disable the form while the tokens get locked in Ethereum
    fieldset.disabled = true

    try {
      await initiateTransfer(amount.value, render)
    } catch (e) {
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    } finally {
      // re-enable the form, whether the call succeeded or failed
      fieldset.disabled = false
    }

    // if the call succeeded, reset the form
    amount.value = ''
    submit.disabled = true
    await render()
    const transfersButton = document.querySelector('#transfers button')
    transfersButton.click()
    transfersButton.focus()
  }

  // transfers are rendered after page load, so we add one click handler to the
  // body tag to handle clicking the "delete" button on any of them
  document.querySelector('body').addEventListener('click', event => {
    const clearTransferButton = event.target.closest('[data-behavior=delete-transfer]')

    // no delete button clicked, end here
    if (!clearTransferButton) return

    const transferId = clearTransferButton.closest('[data-behavior=transfer]').id
    clearTransfer(transferId)
    render()
  })

  // transfers are rendered after page load, so we add one click handler to the
  // body tag to handle clicking the "retry" button on any of them
  document.querySelector('body').addEventListener('click', event => {
    const retryTransferButton = event.target.closest('[data-behavior=retry-transfer]')

    // no retry button clicked, end here
    if (!retryTransferButton) return

    const transferId = retryTransferButton.closest('[data-behavior=transfer]').id
    retryTransfer(transferId, render)
  })
}
