"use client";

import { Plus, X } from "lucide-react";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { Graf } from "@/features/catalog/sample-data";

type ActiveMarker = { sceneId: string; productId: string } | null;

export function GrafProductExplorer({ graf }: { graf: Graf }) {
  const [activeMarker, setActiveMarker] = useState<ActiveMarker>(null);

  return (
    <section className="graf-scenes shell" aria-label="공간 이미지와 연결 상품">
      {graf.scenes.map((scene, sceneIndex) => {
        const activeProduct = graf.products.find(
          (product) =>
            activeMarker?.sceneId === scene.id &&
            activeMarker.productId === product.id,
        );
        const activePosition = scene.markers.find(
          (marker) => marker.productId === activeMarker?.productId,
        );
        const sceneProducts = scene.markers
          .map((marker) =>
            graf.products.find((product) => product.id === marker.productId),
          )
          .filter((product) => product !== undefined);
        const orientation =
          scene.height > scene.width
            ? "portrait"
            : scene.height === scene.width
              ? "square"
              : "landscape";

        return (
          <figure
            className={`graf-scene graf-scene--${orientation}`}
            key={scene.id}
          >
            <div
              className="graf-scene__image"
              style={{ aspectRatio: `${scene.width} / ${scene.height}` }}
            >
              <Image
                src={scene.image}
                alt={scene.alt}
                fill
                priority={sceneIndex === 0}
                sizes={
                  orientation === "portrait"
                    ? "(max-width: 620px) 100vw, 680px"
                    : "(max-width: 1320px) 94vw, 1280px"
                }
              />
              {scene.markers.map((marker) => {
                const product = graf.products.find(
                  (item) => item.id === marker.productId,
                );
                if (!product) return null;
                const isActive =
                  activeMarker?.sceneId === scene.id &&
                  activeMarker.productId === product.id;
                return (
                  <button
                    key={product.id}
                    className={
                      isActive ? "product-marker is-active" : "product-marker"
                    }
                    style={{ left: marker.left, top: marker.top }}
                    type="button"
                    aria-label={`${product.name} 보기`}
                    aria-expanded={isActive}
                    onClick={() =>
                      setActiveMarker(
                        isActive
                          ? null
                          : { sceneId: scene.id, productId: product.id },
                      )
                    }
                  >
                    <Plus size={18} />
                  </button>
                );
              })}
              {activeProduct && activePosition && (
                <div
                  className="marker-preview"
                  style={
                    {
                      "--marker-left": activePosition.left,
                      "--marker-top": activePosition.top,
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    aria-label="상품 미리보기 닫기"
                    onClick={() => setActiveMarker(null)}
                  >
                    <X size={17} />
                  </button>
                  <div className="marker-product">
                    <Image
                      src={activeProduct.image}
                      alt=""
                      width={96}
                      height={96}
                    />
                    <div>
                      <p>
                        {activeProduct.brand} · {activeProduct.collection}
                      </p>
                      <strong>{activeProduct.name}</strong>
                      <span>{activeProduct.price}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <figcaption className="scene-products">
              <div className="scene-products__heading">
                <strong>이 사진에 연결된 상품</strong>
                <span>{sceneProducts.length}</span>
              </div>
              <div className="scene-products__rail">
                {sceneProducts.map((product) => {
                  const isActive =
                    activeMarker?.sceneId === scene.id &&
                    activeMarker.productId === product.id;
                  return (
                    <button
                      type="button"
                      className={
                        isActive ? "scene-product is-active" : "scene-product"
                      }
                      key={product.id}
                      aria-pressed={isActive}
                      onClick={() =>
                        setActiveMarker(
                          isActive
                            ? null
                            : { sceneId: scene.id, productId: product.id },
                        )
                      }
                    >
                      <Image
                        src={product.image}
                        alt=""
                        width={76}
                        height={76}
                      />
                      <span>
                        <small>{product.brand}</small>
                        <strong>{product.name}</strong>
                        <em>{product.price}</em>
                      </span>
                    </button>
                  );
                })}
              </div>
            </figcaption>
          </figure>
        );
      })}
    </section>
  );
}
