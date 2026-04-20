import {NextRequest, NextResponse} from "next/server"

const BASE_URL = "https://app.tablecrm.com/api/v1"

type TableCrmErrorItem = {
  msg?: string;
  loc?: Array<string | number>;
  type?: string;
};

function extractErrorMessage(data: unknown, status: number) {
  if (typeof data === "string") return data

  if (data && typeof data === "object") {
    const obj = data as {
      detail?: string | TableCrmErrorItem[];
      message?: string;
    }

    if (typeof obj.message === "string") return obj.message
    if (typeof obj.detail === "string") return obj.detail

    if (Array.isArray(obj.detail)) {
      return obj.detail
        .map((item) => {
          if (item.msg && Array.isArray(item.loc)) {
            return `${item.loc.join(".")}: ${item.msg}`
          }
          if (item.msg) return item.msg
          return JSON.stringify(item)
        })
        .join("; ")
    }
  }

  return `Ошибка ${status}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {token, payload} = body as {
      token?: string;
      payload?: unknown;
    }

    if (!token) {
      return NextResponse.json(
        {message: "Не передан token"},
        {status: 400}
      )
    }

    if (!payload) {
      return NextResponse.json(
        {message: "Не передан payload"},
        {status: 400}
      )
    }

    const response = await fetch(`${BASE_URL}/docs_sales/?token=${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const text = await response.text()

    let data: unknown = text
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    if (!response.ok) {
      const message = extractErrorMessage(data, response.status)

      console.error("TableCRM POST /docs_sales failed:", {
        status: response.status,
        data,
      })

      return NextResponse.json(
        {
          message,
          details: data,
        },
        {status: response.status}
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Route /api/create-sale crashed:", error)

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Внутренняя ошибка сервера",
      },
      {status: 500}
    )
  }
}