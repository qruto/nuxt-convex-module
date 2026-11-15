/**
 * A Vue port of `@convex-dev/presence/facepile`: {@link FacePile}.
 *
 * @module presence/facepile
 */
import '@convex-dev/presence/facepile.css'
import { defineComponent, h, type PropType } from 'vue'
import type { PresenceState } from './index'

// Vue component that displays a facepile of users based on their presence
// state. This renders a list of avatars for the first 5 users plus a drop-down
// for the rest. You can just drop this into your application but you likely
// want to create your own version with your own custom styling.
/**
 * Avatars of the first five users in a room, and a drop-down with the rest.
 * The styles are the package's own `@convex-dev/presence/facepile.css`.
 *
 * @example
 * ```vue
 * <FacePile :presence-state="presenceState ?? []" />
 * ```
 *
 * @public
 */
export const FacePile = defineComponent({
  name: 'FacePile',
  props: {
    presenceState: { type: Array as PropType<PresenceState[]>, required: true },
  },
  setup(props) {
    return () => {
      const visible = props.presenceState.slice(0, 5)
      const hidden = props.presenceState.slice(5)

      return h('div', { class: 'container' }, [
        h('div', { class: 'avatars' }, [
          ...visible.map((presence, idx) =>
            h(Avatar, {
              key: presence.userId,
              presence,
              index: idx,
              total: visible.length,
            }),
          ),
          hidden.length > 0
            ? h('div', { class: 'more-container' }, [
                h('div', { class: 'avatar more', tabindex: 0 }, `+${hidden.length}`),
                h(Dropdown, { users: hidden }),
              ])
            : null,
        ]),
      ])
    }
  },
})

// fallow-ignore-next-line duplicate-export-alias -- upstream's entry exports it as the default; the name is for auto-imports
export default FacePile

function getEmojiForUserId(userId: string): string {
  // Simple hash function to generate a consistent emoji for a user ID.
  // see https://stackoverflow.com/a/7616484
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0 // Constrain to 32bit integer
  }
  const emojis = ['😊', '😃', '😎', '🤓', '😇', '🤖', '👻', '🐶', '🐱', '🐰']
  return emojis[Math.abs(hash) % emojis.length]!
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = Math.floor((now - timestamp) / 1000)

  if (diff < 60) return 'Last seen just now'
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)} min ago`
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `Last seen ${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  const days = Math.floor(diff / 86400)
  return `Last seen ${days} day${days === 1 ? '' : 's'} ago`
}

const Avatar = defineComponent({
  props: {
    presence: { type: Object as PropType<PresenceState>, required: true },
    index: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  setup(props) {
    return () => {
      const { presence, index, total } = props
      const presenceData = Object.entries(presence.data ?? {}).reduce(
        (acc, [key, value]) => {
          acc[`data-presence-${key}`] = String(value)
          return acc
        },
        {} as Record<`data-presence-${string}`, string>,
      )

      return h(
        'div',
        {
          class: `avatar${presence.online ? ' online' : ' offline'}`,
          tabindex: 0,
          style: { '--z': total - index },
          ...presenceData,
        },
        [
          h('span', { 'role': 'img', 'aria-label': 'user' }, [
            presence.image
              ? h('img', { src: presence.image, alt: 'user' })
              : getEmojiForUserId(presence.userId),
          ]),
          h('span', { class: 'tooltip' }, [
            h('div', { class: 'tooltip-user' }, presence.name || presence.userId),
            h(
              'div',
              { class: 'tooltip-status' },
              presence.online
                ? 'Online now'
                : getTimeAgo(presence.lastDisconnected),
            ),
            presence.data
              ? h('div', { class: 'tooltip-data' }, [
                  h('hr'),
                  ...Object.entries(presence.data).map(([key, value]) =>
                    h('div', { key }, [h('strong', `${key}:`), ` ${String(value)}`]),
                  ),
                ])
              : null,
          ]),
        ],
      )
    }
  },
})

const Dropdown = defineComponent({
  props: {
    users: { type: Array as PropType<PresenceState[]>, required: true },
  },
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'dropdown' },
        props.users.slice(0, 10).map(presence =>
          h('div', { key: presence.userId, class: 'dropdown-row' }, [
            h(
              'div',
              { class: `dropdown-emoji${!presence.online ? ' offline' : ''}` },
              [
                h('span', { 'role': 'img', 'aria-label': 'user' }, [
                  presence.image
                    ? h('img', { src: presence.image, alt: 'user' })
                    : getEmojiForUserId(presence.userId),
                ]),
              ],
            ),
            h('div', { class: 'dropdown-info' }, [
              h('div', { class: 'dropdown-user' }, presence.name || presence.userId),
              h(
                'div',
                { class: 'dropdown-status' },
                presence.online
                  ? 'Online now'
                  : getTimeAgo(presence.lastDisconnected),
              ),
            ]),
          ]),
        ),
      )
  },
})
