const showPercentage = ref(false)

if (typeof localStorage !== 'undefined') {
  const stored = localStorage.getItem('top-card-show-percentage')

  if (stored !== null) {
    showPercentage.value = stored === 'true'
  }
}

export function useTopCardDisplay () {
  function toggleDisplay () {
    showPercentage.value = !showPercentage.value
    localStorage.setItem('top-card-show-percentage', showPercentage.value.toString())
  }

  return {
    showPercentage,
    toggleDisplay
  }
}
