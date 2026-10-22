import { formatCount, LiveTag, Tag, visibilityLabel } from "@/components/badges"
import { houseWhen } from "@/components/house-list"
import { FeatureCard } from "@/components/release-tile"
import type { HouseSummary } from "@/lib/types"

// Card de House com a foto de fundo, para as fileiras do Início e do Perfil.
export function HouseCard({ house }: { house: HouseSummary }) {
  const subtitle =
    house.status === "live"
      ? `${formatCount(house.participants_count)} dentro, ${visibilityLabel[house.visibility]}`
      : houseWhen(house)
  return (
    <FeatureCard
      href={`/houses/${house.slug}`}
      image={house.cover}
      title={house.title}
      subtitle={subtitle}
      tag={
        house.status === "live" ? (
          <LiveTag />
        ) : (
          <Tag tone="muted">{visibilityLabel[house.visibility]}</Tag>
        )
      }
    />
  )
}
