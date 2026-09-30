import { PHONE_ATTRIBUTES } from "./helpers.js";
export function createAccountRenderers(context) {
  function accountView() {
    const {
      state,
      h,
      row,
      roleNames,
      icon,
      button,
      maps,
      fallback,
      offlineDraftsView,
      money,
      vehicleNames,
    } = context();
    const u = state.S.user;
    const section = (title, symbol, content) =>
      h("details", { class: "account-disclosure" }, [
        h("summary", { class: "account-option" }, [
          h("span", { class: "option-icon" }, [icon(symbol)]),
          h("strong", {}, [title]),
          h("span", { class: "option-chevron", "aria-hidden": "true" }, ["‹"]),
        ]),
        h("div", { class: "account-disclosure-content" }, content),
      ]);
    return h("div", { class: "account-options account-profile-options" }, [
      section("معلومات الحساب", "person", [
        h("h2", {}, [u.name]),
        row("رقم الحساب", u.id),
        row("رقم المحفظة", u.walletId),
        row("الهاتف", u.phone),
        ...(u.phone2 ? [row("الهاتف الإضافي", u.phone2)] : []),
        row("نوع الحساب", roleNames[u.role]),
        row("المحافظة", u.province),
        row("المنطقة", u.area),
        row("العنوان", u.address),
        ...(u.vehicle
          ? [row("نوع المركبة", vehicleNames[u.vehicle] || u.vehicle)]
          : []),
        ...(u.plate ? [row("رقم لوحة المركبة", u.plate)] : []),
        ...(u.role === "courier"
          ? [
              row("ميزانية العمل", money(u.budget) + " د.ع"),
              row("نطاق العمل", (u.radius || 0) + " كم"),
            ]
          : []),
        u.pendingProfile
          ? h("p", { class: "status-note" }, [
              "تعديل بيانات الحساب بانتظار موافقة الإدارة.",
            ])
          : "",
        state.S.profileLocked
          ? h("p", { class: "profile-lock" }, [
              "تعديل الملف مقفل حتى إكمال الطلبات والتسويات.",
            ])
          : button("edit-profile", "تعديل معلومات الحساب"),
        button("change-password", "تغيير كلمة مرور الحساب"),
        h("div", { class: "contact-actions" }, [maps(u.location)]),
      ]),
      section("التقييمات", "star", [
        ...fallback(
          state.S.ratings
            .filter((r) => r.target === u.id)
            .map((r) =>
              h("p", { class: "info-line" }, [
                "★".repeat(r.stars),
                " — ",
                r.text,
                " (",
                r.orderId,
                ")",
              ]),
            ),
          [h("p", { class: "muted" }, ["لا توجد تقييمات بعد."])],
        ),
      ]),
      section("المسودات", "draft", [
        ...state.S.orders
          .filter((o) => o.status === "draft")
          .map((o) =>
            h("div", { class: "detail-row" }, [
              h("span", {}, [o.id, " — ", o.recipient?.name || ""]),
              button("order", "عرض المسودة", `data-id="${o.id}"`),
            ]),
          ),
        offlineDraftsView(),
      ]),
    ]);
  }
  function walletView() {
    const { state, h, icon, money, button, ledger } = context();
    const credits = state.S.ledger.reduce(
        (n, r) => n + Math.max(0, r.amount),
        0,
      ),
      debits = state.S.ledger.reduce((n, r) => n + Math.max(0, -r.amount), 0);
    return [
      h(
        "div",
        {
          class: "orbit-motion",
        },
        [
          h(
            "section",
            {
              class: "orbit-wallet",
              "aria-labelledby": "orbit-title",
            },
            [
              h(
                "div",
                {
                  class: "orbit-grid",
                  "aria-hidden": "true",
                },
                [],
              ),
              h(
                "header",
                {
                  class: "orbit-top",
                },
                [
                  h("div", {}, [
                    h(
                      "h2",
                      {
                        id: "orbit-title",
                      },
                      ["محفظتك، بكل وضوح"],
                    ),
                  ]),
                  h(
                    "span",
                    {
                      class: "orbit-wallet-icon",
                      "aria-hidden": "true",
                    },
                    [icon("account_balance_wallet")],
                  ),
                ],
              ),
              h(
                "div",
                {
                  class: "orbit-center",
                },
                [
                  h(
                    "svg",
                    {
                      class: "orbit-rings",
                      viewBox: "0 0 300 250",
                      fill: "none",
                      "aria-hidden": "true",
                    },
                    [
                      h(
                        "ellipse",
                        {
                          cx: "150",
                          cy: "125",
                          rx: "133",
                          ry: "104",
                          stroke: "#ffffff12",
                        },
                        [],
                      ),
                      h(
                        "circle",
                        {
                          cx: "150",
                          cy: "125",
                          r: "99",
                          stroke: "#ffffff0f",
                          "stroke-width": "18",
                        },
                        [],
                      ),
                      h(
                        "path",
                        {
                          d: "M58 87a99 99 0 0 1 185 75",
                          stroke: "#f47d2f",
                          "stroke-width": "3",
                          "stroke-linecap": "round",
                        },
                        [],
                      ),
                      h(
                        "path",
                        {
                          d: "M242 162a99 99 0 0 1-166 29",
                          stroke: "#78c9e2",
                          "stroke-opacity": ".3",
                          "stroke-width": "2",
                          "stroke-dasharray": "2 7",
                        },
                        [],
                      ),
                      h(
                        "circle",
                        {
                          cx: "58",
                          cy: "87",
                          r: "6",
                          fill: "#f47d2f",
                        },
                        [],
                      ),
                      h(
                        "circle",
                        {
                          cx: "243",
                          cy: "162",
                          r: "6",
                          fill: "#f47d2f",
                        },
                        [],
                      ),
                      h(
                        "circle",
                        {
                          cx: "243",
                          cy: "162",
                          r: "12",
                          stroke: "#f47d2f",
                          "stroke-opacity": ".25",
                        },
                        [],
                      ),
                    ],
                  ),
                  h(
                    "div",
                    {
                      class: "orbit-balance",
                    },
                    [
                      h("span", {}, ["الرصيد الحالي"]),
                      h(
                        "strong",
                        {
                          dir: "ltr",
                        },
                        [money(state.S.balance)],
                      ),
                      h("small", {}, ["دينار عراقي"]),
                      h(
                        "span",
                        {
                          class: "orbit-account-type",
                        },
                        ["محفظة تشغيلية"],
                      ),
                    ],
                  ),
                ],
              ),
              h(
                "div",
                {
                  class: "orbit-flows",
                },
                [
                  h("div", {}, [
                    h(
                      "span",
                      {
                        class: "orbit-flow-label",
                      },
                      [
                        h(
                          "i",
                          {
                            class: "orbit-flow-icon incoming",
                          },
                          [icon("south_west")],
                        ),
                        "إجمالي الإضافات",
                      ],
                    ),
                    h(
                      "strong",
                      {
                        dir: "ltr",
                      },
                      [money(credits), h("small", {}, [" IQD"])],
                    ),
                  ]),
                  h(
                    "span",
                    {
                      class: "orbit-flow-divider",
                      "aria-hidden": "true",
                    },
                    [],
                  ),
                  h("div", {}, [
                    h(
                      "span",
                      {
                        class: "orbit-flow-label",
                      },
                      [
                        h(
                          "i",
                          {
                            class: "orbit-flow-icon outgoing",
                          },
                          [icon("north_east")],
                        ),
                        "إجمالي الخصومات",
                      ],
                    ),
                    h(
                      "strong",
                      {
                        dir: "ltr",
                      },
                      [money(debits), h("small", {}, [" IQD"])],
                    ),
                  ]),
                ],
              ),
              h(
                "footer",
                {
                  class: "orbit-footer",
                },
                [
                  h(
                    "div",
                    {
                      class: "orbit-owner",
                    },
                    [
                      h("span", {}, ["صاحب المحفظة"]),
                      h("strong", {}, [state.S.user.name]),
                    ],
                  ),
                  button(
                    "wallet-statement",
                    ["كشف الحركة ", icon("arrow_back")],
                    "",
                    "orbit-statement",
                  ),
                ],
              ),
              button(
                "copy-wallet",
                [
                  h(
                    "span",
                    {
                      dir: "ltr",
                    },
                    [state.S.user.walletId],
                  ),
                  icon("content_copy"),
                ],
                'aria-label="نسخ رقم المحفظة"',
                "orbit-copy",
              ),
              h(
                "span",
                {
                  class: "orbit-shimmer",
                  "aria-hidden": "true",
                },
                [],
              ),
            ],
          ),
        ],
      ),
      h(
        "section",
        {
          class: "surface",
        },
        [
          h(
            "p",
            {
              class: "info-line",
            },
            [
              state.S.settings.freeService
                ? "الخدمة مجانية حالياً."
                : "عمولة الطلب " +
                  money(state.S.settings.commission) +
                  " د.ع • الاشتراك " +
                  money(state.S.settings.subscription) +
                  " د.ع",
            ],
          ),
          h(
            "p",
            {
              class: "muted",
            },
            [
              "رصيد المحفظة مستقل عن ميزانية المندوب وقيمة البضاعة المدفوعة نقداً. تظهر هنا الحركات المسجلة فقط.",
            ],
          ),
        ],
      ),
      h(
        "section",
        {
          class: "surface",
        },
        [h("h3", {}, ["حركات المحفظة"]), ledger(state.S.ledger)],
      ),
      h(
        "section",
        {
          class: "surface",
        },
        [
          h("h3", {}, ["سجل البضاعة والتحصيل والأجور"]),
          ledger(state.S.cashLedger),
        ],
      ),
    ];
  }
  function offlineDraftsView() {
    const { readDrafts, h, button } = context();
    const drafts = readDrafts();
    return h(
      "section",
      {
        class: "surface",
      },
      [
        h("h3", {}, ["مسودات الجهاز"]),
        h(
          "p",
          {
            class: "muted",
          },
          ["مسودات محفوظة على هذا الجهاز فقط: ", drafts.length],
        ),
        drafts.map((d, i) =>
          h(
            "div",
            {
              class: "detail-row",
            },
            [
              h("span", {}, [d.recipient.name]),
              button("sync-draft", "حفظ ضمن المسودات", `data-index="${i}"`),
            ],
          ),
        ),
      ],
    );
  }
  function readDrafts() {
    const { state } = context();
    try {
      return JSON.parse(
        localStorage.getItem("wasel-offline-" + state.S.user.id) || "[]",
      );
    } catch {
      return [];
    }
  }
  function readiness() {
    const { modal, h, mergeProps, attributes, state, input, coords } =
      context();
    modal(
      "جاهزية المندوب",
      h(
        "form",
        {
          id: "readiness-form",
          class: "form-stack",
        },
        [
          h(
            "label",
            {
              class: "checkbox",
            },
            [
              h(
                "input",
                mergeProps(
                  {
                    name: "available",
                    type: "checkbox",
                  },
                  attributes(state.S.user.available ? "checked" : ""),
                ),
                [],
              ),
              "متاح لاستلام طلبات",
            ],
          ),
          input(
            "budget",
            "الميزانية المتاحة لدفع البضائع",
            state.S.user.budget,
            'type="number" min="0" required',
          ),
          input(
            "radius",
            "نطاق الاستلام (كم)",
            state.S.user.radius,
            'type="number" min="1" max="100" required',
          ),
          coords(state.S.user.location),
          h(
            "p",
            {
              class: "inline-error",
            },
            [],
          ),
          h(
            "button",
            {
              class: "primary-button",
            },
            ["حفظ الجاهزية"],
          ),
        ],
      ),
    );
  }
  function profileForm() {
    const { state, modal, h, input, select, provinces, coords } = context();
    const u = state.S.user;
    modal(
      "تعديل الملف",
      h(
        "form",
        {
          id: "profile-form",
          class: "form-stack",
        },
        [
          input("name", "الاسم", u.name, "required"),
          select(
            "province",
            "المحافظة",
            Object.fromEntries(provinces.map((p) => [p, p])),
            u.province,
          ),
          input("area", "المنطقة", u.area, "required"),
          input("address", "العنوان", u.address, "required"),
          input(
            "phone2",
            "هاتف احتياطي",
            u.phone2 || "",
            `${PHONE_ATTRIBUTES} autocomplete="tel"`,
          ),
          coords(u.location),
          h(
            "p",
            {
              class: "file-help",
            },
            ["يرسل التعديل لمراجعة الإدارة مع بقاء رقم الحساب ثابتاً."],
          ),
          h(
            "p",
            {
              class: "inline-error",
            },
            [],
          ),
          h(
            "button",
            {
              class: "primary-button",
            },
            ["إرسال التعديل للمراجعة"],
          ),
        ],
      ),
    );
  }
  return {
    accountView,
    walletView,
    offlineDraftsView,
    readDrafts,
    readiness,
    profileForm,
  };
}
