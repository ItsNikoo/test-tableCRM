'use client'

import {
  PackageSearch,
  Search,
  ShoppingCart,
  Store,
  UserRound,
  WalletCards,
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {SectionHeader} from "@/components/customUI/SectionHeader";
import {SelectStub} from "@/components/customUI/SelectStub";
import {useEffect, useState} from "react";
import {apiRequest} from "@/lib/apiRequest";
import {toast} from "sonner";
import {ApiListResponse, Organization, Paybox, PriceType, Warehouse} from "@/types";


export default function Home() {
  const [tokenQuery, setTokenQuery] = useState<string>("")
  const [token, setToken] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [payboxes, setPayboxes] = useState<Paybox[]>([]);
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [products, setProducts] = useState([]);

  const [isDictionariesLoading, setIsDictionariesLoading] = useState(false);
  const [dictionariesError, setDictionariesError] = useState("");

  useEffect(() => {
    if (!token) return;

    async function fetchDictionaries() {
      setIsDictionariesLoading(true);
      setDictionariesError("");

      try {
        const [
          organizationsData,
          warehousesData,
          payboxesData,
          priceTypesData,
        ] = await Promise.all([
          apiRequest<ApiListResponse<Organization>>("organizations/", {token}),
          apiRequest<ApiListResponse<Warehouse>>("warehouses/", {token}),
          apiRequest<ApiListResponse<Paybox>>("payboxes/", {token}),
          apiRequest<ApiListResponse<PriceType>>("price_types/", {token}),
        ]);

        setOrganizations(organizationsData.result);
        setWarehouses(warehousesData.result);
        setPayboxes(payboxesData.result);
        setPriceTypes(priceTypesData.result);
      } catch (error) {
        setDictionariesError("Не удалось загрузить справочники");
        console.error(error);
      } finally {
        setIsDictionariesLoading(false);
      }
    }

    fetchDictionaries();
  }, [token]);

  async function handleConnect() {
    setIsLoading(true)
    setIsConnected(false)

    try {
      await apiRequest("users/", {token: tokenQuery});
      setToken(tokenQuery);
      setIsConnected(true);
      toast.success("Касса подключена");
    } catch (error) {
      setIsConnected(false);
      const message = error instanceof Error ? error.message : "Неверный токен";
      toast.error(message);
      console.error("Connect error:", message);
    } finally {
      setIsLoading(false)
    }

  }

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
                <FieldLabel className="text-xs text-muted-foreground">
                  Телефон
                </FieldLabel>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input className="h-10 pl-9" placeholder="+74951234567"/>
                </div>
              </Field>
              <SelectStub label="Найденный клиент" value="Клиент не выбран"/>
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
            <div className="mt-4 rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center">
              <PackageSearch className="mx-auto size-8 text-muted-foreground/70"/>
              <p className="mt-3 text-sm font-medium">Товары не найдены</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Начните вводить название или артикул
              </p>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-xs">
            <SectionHeader
              icon={ShoppingCart}
              title="Корзина"
              description="Количество, цена и сумма по позициям"
            />
            <div className="mt-4 rounded-md bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
              Добавьте хотя бы один товар
            </div>
          </section>

          <Field className="gap-2 rounded-lg border bg-card p-4 shadow-xs">
            <FieldLabel>Комментарий</FieldLabel>
            <textarea
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
              0,00 ₽
            </strong>
          </div>
          <Separator/>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11">
              Создать продажу
            </Button>
            <Button className="h-11">Создать и провести</Button>
          </div>
        </div>
      </footer>
    </main>
  );
}
