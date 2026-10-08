<script setup lang="ts">
// The Nuxt and Convex marks on two raised keys, joined by a groove cut into
// the page. A bead runs along the groove each time data moves: toward Convex
// when this page sends, back toward Nuxt when Convex pushes an update.
defineProps<{
  /** Raise by one to send a bead toward Convex. */
  sent?: number
  /** Raise by one to send a bead toward Nuxt. */
  received?: number
}>()
</script>

<template>
  <div class="logos" role="img" aria-label="Nuxt and Convex">
    <span class="key convex">
      <svg viewBox="0 0 48 32" height="26" aria-hidden="true">
        <path
          fill="#00DC82"
          d="M26.88 32H44.64C45.2068 32.0001 45.7492 31.8009 46.24 31.52C46.7308 31.2391 47.2367 30.8865 47.52 30.4C47.8033 29.9135 48.0002 29.3615 48 28.7998C47.9998 28.2381 47.8037 27.6864 47.52 27.2001L35.52 6.56C35.2368 6.0736 34.8907 5.72084 34.4 5.44C33.9093 5.15916 33.2066 4.96 32.64 4.96C32.0734 4.96 31.5307 5.15916 31.04 5.44C30.5493 5.72084 30.2032 6.0736 29.92 6.56L26.88 11.84L20.8 1.59962C20.5165 1.11326 20.1708 0.600786 19.68 0.32C19.1892 0.0392139 18.6467 0 18.08 0C17.5133 0 16.9708 0.0392139 16.48 0.32C15.9892 0.600786 15.4835 1.11326 15.2 1.59962L0.32 27.2001C0.0363166 27.6864 0.000246899 28.2381 3.05588e-07 28.7998C-0.000246288 29.3615 0.0367437 29.9134 0.32 30.3999C0.603256 30.8864 1.10919 31.2391 1.6 31.52C2.09081 31.8009 2.63324 32.0001 3.2 32H14.4C18.8379 32 22.068 30.0092 24.32 26.24L29.76 16.8L32.64 11.84L41.44 26.88H29.76L26.88 32ZM14.24 26.88H6.4L18.08 6.72L24 16.8L20.0786 23.636C18.5831 26.0816 16.878 26.88 14.24 26.88Z"
        />
      </svg>
    </span>

    <span class="groove concave">
      <span v-if="sent" :key="`sent-${sent}`" class="bead toward-convex" />
      <span v-if="received" :key="`received-${received}`" class="bead toward-nuxt" />
    </span>

    <span class="key convex">
      <svg viewBox="50.5 47.4 50.6 51.5" height="34" aria-hidden="true">
        <path
          fill="#F3B01C"
          d="M82.2808 87.6516C89.652 86.8381 96.6012 82.9352 100.427 76.421C98.6156 92.533 80.8853 102.717 66.413 96.4643C65.0795 95.8897 63.9316 94.9339 63.1438 93.705C59.8915 88.6302 58.8224 82.1729 60.3585 76.3129C64.7475 83.8398 73.6717 88.4538 82.2808 87.6516Z"
        />
        <path
          fill="#8D2676"
          d="M60.0895 71.5852C57.1016 78.4465 56.9722 86.4797 60.6353 93.0906C47.7442 83.453 47.8848 62.8294 60.4778 53.2885C61.6425 52.4067 63.0267 51.8833 64.4785 51.8036C70.4486 51.4907 76.5144 53.7835 80.7683 58.0561C72.1254 58.1415 63.7076 63.643 60.0895 71.5852Z"
        />
        <path
          fill="#EE342F"
          d="M84.9366 60.1673C80.5757 54.1253 73.7503 50.0119 66.2722 49.8868C80.7277 43.3669 98.5086 53.9375 100.444 69.5659C100.624 71.0167 100.388 72.4959 99.7409 73.8044C97.04 79.2547 92.032 83.4819 86.1801 85.0464C90.4678 77.144 89.9388 67.4893 84.9366 60.1673Z"
        />
      </svg>
    </span>
  </div>
</template>

<style scoped>
.logos {
  --key: 4.5rem;
  --groove: 4.5rem;
  --bead: 0.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.key {
  display: grid;
  place-items: center;
  width: var(--key);
  aspect-ratio: 1;
  border-radius: 1.25rem;
}

/* The marks sit in the key face, so they catch its light: a lit edge on
   top, a shade under the foot. */
.key svg {
  width: auto;
  filter:
    drop-shadow(0 1px 0 light-dark(rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.12)))
    drop-shadow(0 1px 1px light-dark(rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.5)));
}

.groove {
  position: relative;
  width: var(--groove);
  height: 0.75rem;
  border-radius: 1rem;
}

.bead {
  position: absolute;
  top: 50%;
  left: 0.125rem;
  width: var(--bead);
  height: var(--bead);
  margin-top: calc(var(--bead) / -2);
  border-radius: 50%;
  background: var(--signal-300);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--signal-500) 70%, transparent),
    0 0 8px 2px color-mix(in oklab, var(--signal-500) 65%, transparent);
  opacity: 0;
  animation: 800ms cubic-bezier(0.65, 0, 0.35, 1) both;
}

.toward-convex {
  animation-name: toward-convex;
}

.toward-nuxt {
  animation-name: toward-nuxt;
}

@keyframes toward-convex {
  0% { opacity: 0; transform: translateX(0); }
  15%, 85% { opacity: 1; }
  100% { opacity: 0; transform: translateX(calc(var(--groove) - var(--bead) - 0.25rem)); }
}

@keyframes toward-nuxt {
  0% { opacity: 0; transform: translateX(calc(var(--groove) - var(--bead) - 0.25rem)); }
  15%, 85% { opacity: 1; }
  100% { opacity: 0; transform: translateX(0); }
}

/* Without travel, the bead glows once in the middle of the groove. */
@media (prefers-reduced-motion: reduce) {
  .bead {
    left: calc(50% - var(--bead) / 2);
    animation-name: glow;
  }

  @keyframes glow {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
  }
}
</style>
