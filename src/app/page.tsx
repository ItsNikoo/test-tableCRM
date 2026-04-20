'use client'

import {
  PackageSearch,
  Search,
  ShoppingCart,
  Store,
  UserRound,
  WalletCards,
} from "lucide-react"

import {Button} from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {Input} from "@/components/ui/input"
import {Separator} from "@/components/ui/separator"
import {SectionHeader} from "@/components/customUI/SectionHeader"
import {useCallback, useEffect, useState} from "react"
import {apiRequest} from "@/lib/apiRequest"
import {toast} from "sonner"
import {ApiListResponse, CartItem, Contragent, Organization, Paybox, PriceType, Product, Warehouse} from "@/types"


export default function Home() {
  // Работа с токеном
  const [tokenQuery, setTokenQuery] = useState<string>("")
  const [token, setToken] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Словари (организации, склады и т.д.)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [payboxes, setPayboxes] = useState<Paybox[]>([])
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [productSearch, setProductSearch] = useState("")

  const [isDictionariesLoading, setIsDictionariesLoading] = useState(false)
  const [dictionariesError, setDictionariesError] = useState("")

  // Телефон
  const [phoneQuery, setPhoneQuery] = useState("")
  const [contragent, setContragent] = useState<Contragent | null>(null)
  const [isPhoneLoading, setIsPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState("")

  // Корзина
  const [cart, setCart] = useState<CartItem[]>([])

  // POST запрос
  const [selectedOrg, setSelectedOrg] = useState<number | "">("")
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | "">("")
  const [selectedPaybox, setSelectedPaybox] = useState<number | "">("")
  const [selectedPriceType, setSelectedPriceType] = useState<number | "">("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      p.barcodes?.some((b) => b.includes(q))
    )
  })

  useEffect(() => {
    if (!token) return

    async function fetchDictionaries() {
      setIsDictionariesLoading(true)
      setDictionariesError("")

      try {
        const [
          organizationsData,
          warehousesData,
          payboxesData,
          priceTypesData,
          productsData,
        ] = await Promise.all([
          apiRequest<ApiListResponse<Organization>>("organizations/", {token}),
          apiRequest<ApiListResponse<Warehouse>>("warehouses/", {token}),
          apiRequest<ApiListResponse<Paybox>>("payboxes/", {token}),
          apiRequest<ApiListResponse<PriceType>>("price_types/", {token}),
          apiRequest<ApiListResponse<Product>>("nomenclature/", {
            token,
            query: {
              with_prices: "true",
              with_balance: "true",
            },
          }),
        ])

        setOrganizations(organizationsData.result)
        setWarehouses(warehousesData.result)
        setPayboxes(payboxesData.result)
        setPriceTypes(priceTypesData.result)
        setProducts(productsData.result)
      } catch (error) {
        setDictionariesError("Не удалось загрузить справочники")
        console.error(error)
      } finally {
        setIsDictionariesLoading(false)
      }
    }

    fetchDictionaries()
  }, [token])

  async function handleConnect() {
    setIsLoading(true)
    setIsConnected(false)

    try {
      await apiRequest("users/", {token: tokenQuery})
      setToken(tokenQuery)
      setIsConnected(true)
      toast.success("Касса подключена")
    } catch (error) {
      setIsConnected(false)
      const message = error instanceof Error ? error.message : "Неверный токен"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePhoneSearch(phone: string) {
    setPhoneQuery(phone)
    setContragent(null)
    setPhoneError("")

    if (phone.length < 6) return

    setIsPhoneLoading(true)
    try {
      const data = await apiRequest<ApiListResponse<Contragent>>("contragents/", {
        token,
        method: "GET",
      })
      const found = data.result.find((c) =>
        c.phone?.replace(/\D/g, "").includes(phone.replace(/\D/g, ""))
      )
      if (found) {
        setContragent(found)
      } else {
        setPhoneError("Клиент не найден")
      }
    } catch {
      setPhoneError("Ошибка поиска")
    } finally {
      setIsPhoneLoading(false)
    }
  }

  function handleAddToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? {...i, quantity: i.quantity + 1} : i
        )
      }
      return [...prev, {product, quantity: 1}]
    })
  }

  function handleChangeQuantity(id: number, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === id ? {...i, quantity: i.quantity + delta} : i)
        .filter((i) => i.quantity > 0)
    )
  }

  const totalSum = cart.reduce((sum, i) => {
    const price = i.product.prices?.[0]?.price ?? 0
    return sum + price * i.quantity
  }, 0)

  const handleSubmit = useCallback(async (conduct: boolean) => {
    if (!selectedOrg || !selectedWarehouse || !selectedPaybox) {
      toast.error("Заполните организацию, счёт и склад")
      return
    }
    if (cart.length === 0) {
      toast.error("Добавьте хотя бы один товар")
      return
    }

    setIsSubmitting(true)

    const payload = [
      {
        dated: Math.floor(Date.now() / 1000),
        warehouse: selectedWarehouse,
        organization: selectedOrg,
        paybox: selectedPaybox,
        status: conduct,
        goods: cart.map((i) => ({
          nomenclature: i.product.id,
          quantity: i.quantity,
          price: i.product.prices?.[0]?.price ?? 0,
        })),
      },
    ]

    try {
      const response = await fetch("/api/create-sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          payload,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof result?.message === "string"
            ? result.message
            : "Ошибка создания продажи"
        )
      }

      toast.success(conduct ? "Продажа создана и проведена" : "Продажа создана")
      setCart([])
      setContragent(null)
      setPhoneQuery("")
      setComment("")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ошибка создания продажи"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedOrg, selectedWarehouse, selectedPaybox, cart, token])

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-foreground">
      <div
        className="mx-auto min-h-screen w-full max-w-md bg-background px-4 pb-28 pt-5 shadow-sm sm:my-6 sm:min-h-0 sm:rounded-lg sm:border sm:px-5">
        <header className="space-y-5 pb-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-tight">
              tablecrm.com
            </div>
            {isConnected ?
              <div
                className="rounded-full border border-green/20 bg-green/10 px-3 py-1 text-xs font-medium text-green-900">
                Касса подключена
              </div> :
              <div
                className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                Касса не подключена
              </div>

            }
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Мобильный заказ
            </h1>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              WebApp для создания продажи и проведения в один клик.
            </p>
          </div>
        </header>

        <div className="space-y-5">
          <section className="rounded-lg border bg-card p-4 shadow-xs">
            <SectionHeader
              icon={WalletCards}
              title="1. Подключение кассы"
              description="Введите токен и загрузите справочники"
            />
            <FieldGroup className="mt-4 gap-3">
              <Field className="gap-2">
                <FieldLabel className="text-xs text-muted-foreground">
                  Token
                </FieldLabel>
                <div className="flex gap-2">
                  <Input className="h-10" placeholder="Введите токен"
                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenQuery(e.target.value)}/>
                  <Button
                    className="h-10 shrink-0"
                    onClick={handleConnect}
                    disabled={isLoading || tokenQuery.trim() === ""}
                  >{isLoading ? "Проверяем токен" : "Подключить"}</Button>
                </div>
              </Field>
            </FieldGroup>
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-xs">
            <SectionHeader
              icon={UserRound}
              title="2. Клиент"
              description="Поиск клиента по телефону"
            />
            <FieldGroup className="mt-4 gap-4">
              <Field className="gap-2">
                <FieldLabel className="text-xs text-muted-foreground">Телефон</FieldLabel>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                  {isPhoneLoading && (
                    <div
                      className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"/>
                  )}
                  <Input
                    className="h-10 pl-9"
                    placeholder="+74951234567"
                    value={phoneQuery}
                    disabled={!isConnected}
                    onChange={(e) => handlePhoneSearch(e.target.value)}
                  />
                </div>
              </Field>

              {contragent && (
                <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
                  <UserRound className="size-4 shrink-0 text-muted-foreground"/>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{contragent.name}</p>
                    <p className="text-xs text-muted-foreground">{contragent.phone}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto shrink-0 text-muted-foreground"
                    onClick={() => {
                      setContragent(null)
                      setPhoneQuery("")
                    }}
                  >✕</Button>
                </div>
              )}

              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}

              {!isConnected && (
                <p className="text-xs text-muted-foreground">Подключите кассу для поиска клиентов</p>
              )}
            </FieldGroup>
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-xs">
            <SectionHeader
              icon={Store}
              title="3. Параметры продажи"
              description="Счёт, организация, склад и тип цены"
            />

            {!isConnected && (
              <p className="mt-4 text-sm text-muted-foreground">Подключите кассу для загрузки справочников</p>
            )}

            {isDictionariesLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"/>
                Загружаем справочники...
              </div>
            )}

            {dictionariesError && (
              <p className="mt-4 text-sm text-destructive">{dictionariesError}</p>
            )}

            {isConnected && !isDictionariesLoading && !dictionariesError && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field className="gap-2">
                  <FieldLabel className="text-xs text-muted-foreground">Организация</FieldLabel>
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(Number(e.target.value))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring">
                    <option value="">Выберите...</option>
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>{o.work_name || o.short_name}</option>
                    ))}
                  </select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel className="text-xs text-muted-foreground">Счёт</FieldLabel>
                  <select
                    value={selectedPaybox}
                    onChange={(e) => setSelectedPaybox(Number(e.target.value))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring">
                    <option value="">Выберите...</option>
                    {payboxes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel className="text-xs text-muted-foreground">Склад</FieldLabel>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring">
                    <option value="">Выберите...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel className="text-xs text-muted-foreground">Тип цены</FieldLabel>
                  <select
                    value={selectedPriceType}
                    onChange={(e) => setSelectedPriceType(Number(e.target.value))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring">
                    <option value="">Выберите...</option>
                    {priceTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-xs">
            <SectionHeader
              icon={PackageSearch}
              title="4. Товары"
              description="Поиск и добавление номенклатуры"
            />

            {!isConnected && (
              <div className="mt-4 rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center">
                <PackageSearch className="mx-auto size-8 text-muted-foreground/70"/>
                <p className="mt-3 text-sm font-medium">Подключите кассу</p>
              </div>
            )}

            {isDictionariesLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"/>
                Загружаем товары...
              </div>
            )}

            {isConnected && !isDictionariesLoading && (
              <>
                <div className="relative mt-4">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input
                    className="h-10 pl-9"
                    placeholder="Название или артикул"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                {filteredProducts.length > 0 ? (
                  <ul className="mt-3 max-h-[280px] divide-y overflow-y-auto rounded-md border">
                    {filteredProducts.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.code && <span>Арт: {p.code}</span>}
                            {p.unit_name && <span> · {p.unit_name}</span>}
                            {p.prices?.[0] && (
                              <span className="ml-1 font-medium text-foreground">
                      {p.prices[0].price.toLocaleString("ru-RU")} ₽
                    </span>
                            )}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 shrink-0 p-0 text-base"
                          onClick={() => handleAddToCart(p)}
                        >+</Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center">
                    <PackageSearch className="mx-auto size-8 text-muted-foreground/70"/>
                    <p className="mt-3 text-sm font-medium">Ничего не найдено</p>
                    <p className="mt-1 text-xs text-muted-foreground">Попробуйте другой запрос</p>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-xs">
            <SectionHeader
              icon={ShoppingCart}
              title="Корзина"
              description="Количество, цена и сумма по позициям"
            />

            {cart.length === 0 ? (
              <div className="mt-4 rounded-md bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                Добавьте хотя бы один товар
              </div>
            ) : (
              <ul className="mt-4 divide-y rounded-md border">
                {cart.map(({product, quantity}) => (
                  <li key={product.id} className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(product.prices?.[0]?.price ?? 0).toLocaleString("ru-RU")} ₽ · {product.unit_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                              onClick={() => handleChangeQuantity(product.id, -1)}>−</Button>
                      <span className="w-6 text-center text-sm">{quantity}</span>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                              onClick={() => handleChangeQuantity(product.id, +1)}>+</Button>
                    </div>
                    <span className="w-20 text-right text-sm font-medium">
            {((product.prices?.[0]?.price ?? 0) * quantity).toLocaleString("ru-RU")} ₽
          </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Field className="gap-2 rounded-lg border bg-card p-4 shadow-xs">
            <FieldLabel>Комментарий</FieldLabel>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-24 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Комментарий к продаже"
            />
            <FieldDescription>
              Будет добавлен в создаваемую продажу.
            </FieldDescription>
          </Field>
        </div>
      </div>

      <footer
        className="fixed inset-x-0 bottom-0 border-t bg-background/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Итого</span>
            <strong className="text-2xl font-semibold tracking-tight">
              {totalSum.toLocaleString("ru-RU", {minimumFractionDigits: 2})} ₽
            </strong>
          </div>
          <Separator/>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-11"
              disabled={isSubmitting || !isConnected}
              onClick={() => handleSubmit(false)}
            >
              {isSubmitting ? "Создаём..." : "Создать продажу"}
            </Button>

            <Button
              className="h-11"
              disabled={isSubmitting || !isConnected}
              onClick={() => handleSubmit(true)}
            >
              {isSubmitting ? "Проводим..." : "Создать и провести"}
            </Button>
          </div>
        </div>
      </footer>
    </main>
  )
}
