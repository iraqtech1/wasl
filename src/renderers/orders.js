import LocationPanel from "../components/LocationPanel.vue";
import OrderQr from "../components/OrderQr.js";
import ScanCodeField from "../components/ScanCodeField.vue";
import { paginate } from "../services/pagination.js";
import AdSlider from "../components/AdSlider.vue";
import LocationMap from "../components/LocationMap.js";
import LocationShare from "../components/LocationShare.vue";
import { trackingLink } from "../services/tracking.js";
import { areas } from "../services/orderPolicy.js";
import { PHONE_ATTRIBUTES } from "./helpers.js";
export function createOrdersRenderers(context) {
  function homeView() {
    const {
      state,
      before,
      closed,
      h,
      icon,
      button,
      money,
      date,
      metric,
      statusPicker,
      orderList,
    } = context();
    const u = state.S.user;
    const own = state.S.orders.filter(
        (o) => u.role === "merchant" || o.courier === u.id,
      ),
      active = own.filter(
        (o) => !before.includes(o.status) && !closed.includes(o.status),
      ).length,
      pickup = own.filter((o) =>
        ["reserved", "approaching", "arrived", "waiting"].includes(o.status),
      ).length,
      returns = own.filter((o) =>
        ["failed", "return_pending", "returning", "partial_pending"].includes(
          o.status,
        ),
      ).length;
    const pagination = paginate(
      own.filter((o) =>
        state.filter === "all"
          ? !closed.includes(o.status)
          : o.status === state.filter,
      ),
      state.homePage,
    );
    const pageButton = (label, page, disabled = false, current = false) =>
      h(
        "button",
        {
          type: "button",
          "data-action": "home-page",
          "data-page": page,
          disabled,
          "aria-current": current ? "page" : undefined,
          "aria-label": typeof label === "number" ? `الصفحة ${label}` : label,
        },
        [label],
      );
    return [
      u.role === "merchant"
        ? h(AdSlider)
        : h(
            "section",
            {
              class: "surface",
            },
            [
              h(
                "div",
                {
                  class: "row",
                },
                [
                  h("div", {}, [
                    h("h2", {}, [u.name]),
                    h(
                      "p",
                      {
                        class: "muted",
                      },
                      [
                        icon("location_on"),
                        " ",
                        u.province,
                        "، ",
                        u.area,
                        " ",
                        h("b", {}, ["• ", u.id]),
                      ],
                    ),
                  ]),
                  button(
                    "refresh",
                    icon("sync"),
                    'aria-label="تحديث البيانات"',
                    "icon-button",
                  ),
                ],
              ),
              [
                h(
                  "div",
                  {
                    class: "order-strip",
                    style: "margin-top:14px",
                  },
                  [
                    h("div", {}, [
                      h("strong", {}, [
                        u.available
                          ? "متاح لاستلام الطلبات"
                          : "غير متاح حالياً",
                      ]),
                      h(
                        "p",
                        {
                          class: "muted",
                        },
                        [
                          "الميزانية ",
                          money(u.budget),
                          " د.ع • نطاق ",
                          u.radius,
                          " كم",
                        ],
                      ),
                    ]),
                    button("readiness", "تحديث الجاهزية"),
                    button(
                      "tracking",
                      state.trackingId === null
                        ? "مشاركة الموقع أثناء العمل"
                        : "إيقاف مشاركة الموقع",
                    ),
                  ],
                ),
                u.restrictedUntil && Date.parse(u.restrictedUntil) > Date.now()
                  ? h(
                      "p",
                      {
                        class: "status-note",
                      },
                      [
                        "الحجوزات الجديدة مقيّدة حتى ",
                        date(u.restrictedUntil),
                        ". يمكنك إكمال الشحنات بعهدتك.",
                      ],
                    )
                  : "",
              ],
            ],
          ),
      h(
        "div",
        {
          class: "metrics-grid",
        },
        [
          metric("شحنات نشطة", active, "local_shipping"),
          metric("قبل الاستلام", pickup, "inventory_2", "orange"),
          metric("رصيد المحفظة", money(state.S.balance), "payments", "teal"),
          metric("تعذر ومرتجعات", returns, "assignment_return", "red"),
        ],
      ),
      u.role === "merchant"
        ? h(
            "div",
            {
              class: "row",
            },
            [
              h(
                "h2",
                {
                  class: "section-title live-shipments-title",
                },
                ["الشحنات المباشرة"],
              ),
              button("nav", "عرض السجل", 'data-screen="registry"'),
            ],
          )
        : h(
            "h2",
            {
              class: "section-title",
            },
            ["الطلبات بعهدتي"],
          ),
      statusPicker(),
      pagination.total
        ? h("p", { class: "home-page-summary", role: "status" }, [
            `عرض ${pagination.start}–${pagination.end} من ${pagination.total} شحنة`,
          ])
        : "",
      orderList(pagination.items),
      pagination.pages > 1
        ? h(
            "nav",
            { class: "shipment-pagination", "aria-label": "صفحات الشحنات" },
            [
              pageButton("السابق", pagination.page - 1, pagination.page === 1),
              ...pagination.numbers.flatMap((number, index, numbers) => [
                index && number - numbers[index - 1] > 1
                  ? h("span", { "aria-hidden": "true" }, ["…"])
                  : "",
                pageButton(number, number, false, number === pagination.page),
              ]),
              pageButton(
                "التالي",
                pagination.page + 1,
                pagination.page === pagination.pages,
              ),
            ],
          )
        : "",
    ];
  }
  function statusPicker() {
    const { state, h, icon, baseOrders } = context();
    const options = [
      ["all", "جميع الحالات"],
      ...Object.entries(state.S.statuses),
    ];
    return h(
      "div",
      {
        class: "status-picker",
      },
      [
        h(
          "button",
          {
            id: "status-trigger",
            class: "status-trigger",
            "data-action": "filter-open",
            "aria-haspopup": "listbox",
            "aria-controls": "status-menu",
            "aria-expanded": "false",
          },
          [
            icon("filter_list"),
            h(
              "span",
              {
                class: "status-trigger-label",
                title: state.S.statuses[state.filter] || "جميع الحالات",
              },
              [state.S.statuses[state.filter] || "جميع الحالات"],
            ),
            h(
              "span",
              {
                class: "status-trigger-count",
              },
              [
                h(
                  "svg",
                  { viewBox: "0 0 28 28", class: "status-count-number" },
                  [
                    h(
                      "text",
                      {
                        x: 14,
                        y: 14,
                        "text-anchor": "middle",
                        "dominant-baseline": "central",
                      },
                      [
                        baseOrders().filter(
                          (o) =>
                            state.filter === "all" || o.status === state.filter,
                        ).length,
                      ],
                    ),
                  ],
                ),
              ],
            ),
            icon("expand_more"),
          ],
        ),
        h(
          "div",
          {
            id: "status-menu",
            popover: "auto",
            class: "status-menu",
          },
          [
            h(
              "div",
              {
                class: "status-menu-heading",
              },
              ["حالة الشحنة", h("span", {}, ["عدد الطلبات"])],
            ),
            h(
              "div",
              {
                role: "listbox",
                "aria-label": "حالة الشحنة",
              },
              [
                options.map(([v, label]) =>
                  h(
                    "button",
                    {
                      role: "option",
                      "aria-selected": state.filter === v,
                      tabindex: state.filter === v ? 0 : -1,
                      "data-action": "filter",
                      "data-value": v,
                      class: "status-option status-" + v,
                    },
                    [
                      h(
                        "span",
                        {
                          class: "status-icon material-symbols-outlined",
                          "aria-hidden": "true",
                        },
                        [
                          v === "all"
                            ? "filter_list"
                            : v.startsWith("return")
                              ? "assignment_return"
                              : v === "delivered"
                                ? "check_circle"
                                : v === "cancelled"
                                  ? "cancel"
                                  : v === "draft"
                                    ? "edit_note"
                                    : "local_shipping",
                        ],
                      ),
                      h(
                        "span",
                        {
                          class: "status-option-label",
                        },
                        [label],
                      ),
                      h(
                        "span",
                        {
                          class: "status-check material-symbols-outlined",
                          "aria-hidden": "true",
                        },
                        ["check"],
                      ),
                      h(
                        "span",
                        {
                          class: "status-badge",
                        },
                        [
                          baseOrders().filter(
                            (o) => v === "all" || o.status === v,
                          ).length,
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
  function baseOrders() {
    const { state } = context();
    return state.S.orders.filter((o) =>
      state.screen === "available"
        ? o.status === "published"
        : state.S.user.role === "courier"
          ? o.courier === state.S.user.id
          : true,
    );
  }
  function ordersView() {
    const { baseOrders, state, h, statusPicker, button, icon, orderList } =
      context();
    const os = baseOrders().filter(
      (o) =>
        (state.filter === "all" || o.status === state.filter) &&
        (!state.query ||
          JSON.stringify([o.id, o.recipient, o.sender]).includes(state.query)),
    );
    const registry = state.screen === "registry";
    const showAll = state.registrySize === "all";
    const pagination = paginate(
      os,
      state.registryPage,
      showAll ? Math.max(1, os.length) : 10,
    );
    const pageButton = (label, page, disabled = false, current = false) =>
      h(
        "button",
        {
          type: "button",
          "data-action": "registry-page",
          "data-page": page,
          disabled,
          "aria-current": current ? "page" : undefined,
          "aria-label": typeof label === "number" ? `الصفحة ${label}` : label,
        },
        [label],
      );
    return [
      h(
        "section",
        {
          class: "search-row",
        },
        [
          h(
            "input",
            {
              id: "order-search",
              "aria-label": "البحث عن طلب",
              placeholder: "ابحث برقم الطلب أو الاسم أو المنطقة",
              value: state.query,
            },
            [],
          ),
          statusPicker(),
          state.screen === "available"
            ? button("merchant-map", [icon("map"), " تجميع حسب الموقع"])
            : "",
        ],
      ),
      h(
        "p",
        {
          class: "info-line",
        },
        [
          os.length,
          " طلب ",
          state.screen === "available"
            ? "يناسب الموقع والمركبة والميزانية"
            : "",
        ],
      ),
      registry
        ? h("div", { class: "registry-display-options" }, [
            h("div", { class: "registry-display-copy" }, [
              h("strong", {}, ["عدد الطلبات المعروضة"]),
              h("p", { class: "home-page-summary", role: "status" }, [
                `عرض ${pagination.start}–${pagination.end} من ${pagination.total} طلب`,
              ]),
            ]),
            h(
              "label",
              { class: "registry-show-all", for: "registry-show-all" },
              [
                h(
                  "input",
                  {
                    type: "checkbox",
                    id: "registry-show-all",
                    checked: showAll,
                  },
                  [],
                ),
                h("span", {}, ["إظهار الكل"]),
              ],
            ),
          ])
        : "",
      orderList(registry ? pagination.items : os),
      registry && !showAll && pagination.pages > 1
        ? h(
            "nav",
            { class: "shipment-pagination", "aria-label": "صفحات السجل" },
            [
              pageButton("السابق", pagination.page - 1, pagination.page === 1),
              ...pagination.numbers.flatMap((number, index, numbers) => [
                index && number - numbers[index - 1] > 1
                  ? h("span", { "aria-hidden": "true" }, ["…"])
                  : "",
                pageButton(number, number, false, number === pagination.page),
              ]),
              pageButton(
                "التالي",
                pagination.page + 1,
                pagination.page === pagination.pages,
              ),
            ],
          )
        : "",
    ];
  }
  function orderList(os) {
    const { h, icon, state, vehicleNames, money, button } = context();
    return os.length
      ? os.map((o) =>
          h(
            "article",
            {
              class:
                "order-card" + (o.service === "vip" ? " order-card-vip" : ""),
            },
            [
              h(
                "div",
                {
                  class: "order-top",
                },
                [
                  h(
                    "div",
                    {
                      class: "order-id",
                    },
                    [
                      h(
                        "span",
                        {
                          class: "order-index",
                        },
                        [icon(o.kind === "free" ? "bolt" : "inventory_2")],
                      ),
                      h("h3", {}, [o.id]),
                    ],
                  ),
                  h(
                    "span",
                    {
                      class: "chip " + o.status,
                    },
                    [state.S.statuses[o.status]],
                  ),
                ],
              ),
              h(
                "div",
                {
                  class: "order-strip",
                },
                [
                  h("div", {}, [
                    h("strong", {}, [
                      o.recipient.name || "بيانات المستلم تظهر بعد الاستلام",
                    ]),
                    h(
                      "p",
                      {
                        class: "muted",
                      },
                      [
                        o.sender.area || o.sender.province,
                        " ← ",
                        o.recipient.area,
                        " • ",
                        vehicleNames[o.vehicle],
                      ],
                    ),
                  ]),
                  o.service === "vip"
                    ? h(
                        "span",
                        {
                          class: "vip-badge",
                          "aria-label": "طلب VIP — مندوب مخصص",
                        },
                        [icon("workspace_premium"), "VIP"],
                      )
                    : "",
                ],
              ),
              h(
                "div",
                {
                  class: "money-grid",
                },
                [
                  h("div", {}, [
                    h("span", {}, ["البضاعة"]),
                    h("strong", {}, [money(o.amount), " د.ع"]),
                  ]),
                  h("div", {}, [
                    h("span", {}, ["التوصيل"]),
                    h("strong", {}, [money(o.fee), " د.ع"]),
                  ]),
                  h("div", {}, [
                    h("span", {}, ["أجرة الراجع"]),
                    h("strong", {}, [money(o.returnFee), " د.ع"]),
                  ]),
                ],
              ),
              h(
                "div",
                {
                  class: "order-bottom",
                },
                [
                  h(
                    "span",
                    {
                      class: "muted",
                    },
                    [
                      o.count,
                      " قطع • ",
                      o.weight,
                      " كغم • الأجرة على ",
                      o.feePayer === "merchant" ? "التاجر" : "الزبون",
                      " ",
                      o.settled ? "• مسوّى" : "",
                    ],
                  ),
                  button("order", "تفاصيل الطلب", `data-id="${o.id}"`),
                ],
              ),
            ],
          ),
        )
      : h(
          "div",
          {
            class: "empty",
          },
          ["لا توجد طلبات بهذه الحالة"],
        );
  }
  function availableActions(o) {
    const { state, before, closed } = context();
    const own = state.S.user.id === o.merchant,
      assigned = state.S.user.id === o.courier,
      entries = [];
    const add = (action, label) => entries.push([action, label]);
    if (own && o.extensionRequest) {
      add("approve_extension", "الموافقة على التمديد");
      add("reject_extension", "رفض التمديد وإعادة النشر");
    }
    if (assigned && o.editPending) {
      add("keep_edit", "قبول بيانات الطلب المعدلة");
      add("decline_edit", "رفض التعديل دون عقوبة");
    }
    if (assigned && o.settled && ["delivered", "returned"].includes(o.status))
      add("complete", "إنهاء الطلب");
    if (own) {
      if (before.includes(o.status)) {
        add("edit", "تعديل الطلب");
        if (o.status === "draft") {
          add("publish", "نشر الطلب");
          add("delete", "حذف المسودة");
        } else {
          if (o.status === "published") {
            add("unpublish", "إلغاء النشر");
            add("raise_fee", "أنا مستعجل — زيادة الأجرة");
          }
          add("cancel", "إلغاء الطلب");
        }
      }
      if (o.status === "retry" && !o.retryApproved)
        add("approve_retry", "الموافقة على الموعد");
      if (o.status === "at_customer" && o.partial && !o.partial.approved)
        add("partial_approve", "الموافقة على التسليم الجزئي");
      if (["failed", "retry"].includes(o.status))
        add("return", "طلب إرجاع الشحنة");
      if (o.status === "returning" && o.returnArrived && !o.returnReceived)
        add("receive_return", "تأكيد استلام المرتجع");
    }
    if (state.S.user.role === "courier" && o.status === "published") {
      add("reserve", "حجز الطلب");
      if (
        Date.now() - Date.parse(o.publishedAt || o.createdAt) >=
        state.S.settings.offerAfterMinutes * 60000
      )
        add("offer", "اقتراح أجرة");
    }
    if (assigned) {
      if (o.status === "reserved") add("depart", "أنا في الطريق");
      if (["reserved", "approaching"].includes(o.status)) {
        add("arrive", "وصلت إلى موقع الاستلام");
        if (!o.extended && !o.extensionRequest) add("extend", "تمديد المهلة");
      }
      if (["reserved", "approaching", "arrived", "waiting"].includes(o.status))
        add("release", "إلغاء الحجز مع سبب");
      if (o.status === "arrived") add("wait", "بانتظار تجهيز الشحنة");
      if (["arrived", "waiting"].includes(o.status))
        add("pickup", "فحص ودفع واستلام");
      if (o.status === "received") add("transit", "بدء التوصيل");
      if (o.status === "transit" || (o.status === "retry" && o.retryApproved))
        add("customer_arrive", "وصلت إلى الزبون");
      if (o.status === "at_customer") {
        add("deliver", "تأكيد التسليم والتحصيل");
        if (state.S.settings.partialEnabled && o.kind !== "free") {
          if (!o.partial) add("partial_propose", "اقتراح تسليم جزئي");
          if (o.partial?.approved) add("partial_confirm", "تأكيد الجزء المسلم");
        }
      }
      if (["transit", "at_customer", "retry"].includes(o.status))
        add("fail", "تعذر التسليم");
      if (o.status === "failed") {
        if (true) add("retry", "اقتراح إعادة المحاولة");
        add("return", "بدء مسار الإرجاع");
      }
      if (["return_pending", "partial_pending"].includes(o.status))
        add("return_start", "التوجه لإرجاع الشحنة");
      if (o.status === "returning") {
        if (!o.returnArrived) add("return_arrive", "وصلت بالمرتجع");
        if (o.returnReceived)
          add("settle_return", "تأكيد استرداد القيمة والأجور");
      }
      if (o.status === "delivered" && !o.settled)
        add("settle_delivery", "تأكيد التسوية مع المرسل");
    }
    if ((own || assigned) && o.courier) add("chat", "محادثة هذا الطلب");
    if (
      (own || assigned) &&
      closed.includes(o.status) &&
      o.status !== "cancelled" &&
      o.settled &&
      !state.S.ratings.some(
        (r) => r.owner === state.S.user.id && r.orderId === o.id,
      )
    )
      add("rate", "تقييم الطرف الآخر");
    return entries;
  }
  function orderDetail(oid) {
    const {
      state,
      modal,
      h,
      row,
      natureNames,
      vehicleNames,
      money,
      customerDue,
      before,
      date,
      maps,
      icon,
      availableActions,
      button,
    } = context();
    const o = state.S.orders.find((o) => o.id === oid);
    if (!o) return;
    const isOwn = o.merchant === state.S.user.id;
    const offers = state.S.offers.filter((x) => x.orderId === oid);
    modal(o.id, [
      o.demo
        ? h(
            "p",
            {
              class: "status-note",
            },
            ["طلب تجريبي محلي؛ لا يمثل شحنة حقيقية."],
          )
        : "",
      h(
        "span",
        {
          class: "chip " + o.status,
        },
        [state.S.statuses[o.status]],
      ),
      row("المرسل", o.sender.name),
      o.service === "vip"
        ? h("span", { class: "vip-badge vip-detail" }, [
            icon("workspace_premium"),
            "VIP — مندوب مخصص",
          ])
        : "",
      row("المستلم", o.recipient.name || "محجوب حتى الاستلام"),
      row("عنوان التسليم", o.recipient.address || o.recipient.area),
      o.recipient.landmark ? row("نقطة دالة", o.recipient.landmark) : "",
      row(
        "تفاصيل الشحنة",
        `${o.count} قطع • ${o.weight} كغم • ${o.length}×${o.width}×${o.height} سم`,
      ),
      row(
        "الطبيعة والمركبة",
        natureNames[o.nature] + " • " + vehicleNames[o.vehicle],
      ),
      row("قيمة البضاعة", money(o.amount) + " د.ع"),
      row(
        "أجرة التوصيل",
        money(o.fee) +
          " د.ع — على " +
          (o.feePayer === "merchant" ? "التاجر" : "الزبون"),
      ),
      row("أجرة الراجع", money(o.returnFee) + " د.ع"),
      row("المطلوب من الزبون", money(customerDue(o)) + " د.ع"),
      Number.isFinite(o.distanceKm)
        ? row(
            "مسافة التوصيل التقريبية",
            o.distanceKm.toFixed(1) + " كم — مسافة مباشرة",
          )
        : "",
      isOwn || o.courier === state.S.user.id
        ? h("div", { class: "tracking-link-row" }, [
            "رابط متابعة الحالة (نسخة عند المشاركة)",
            h(
              "a",
              {
                class: "tracking-link",
                href: trackingLink(o),
                target: "_blank",
                rel: "noopener noreferrer",
              },
              ["فتح متابعة الطلب"],
            ),
          ])
        : "",
      row("تسوية الأموال", o.settled ? "مكتملة" : "غير مكتملة"),
      o.notes ? row("الملاحظات", o.notes) : "",
      o.courierInfo?.photo
        ? h(
            "div",
            {
              class: "photo-preview",
            },
            [
              h(
                "img",
                {
                  alt: "صورة المندوب",
                  src: o.courierInfo.photo,
                },
                [],
              ),
            ],
          )
        : "",
      o.courierInfo
        ? row(
            "المندوب",
            o.courierInfo.name +
              " • " +
              vehicleNames[o.courierInfo.vehicle] +
              " • " +
              o.courierInfo.plate,
          )
        : "",
      isOwn && o.handoverCode && before.includes(o.status)
        ? h(
            "div",
            {
              class: "review-group",
            },
            [
              h("h3", {}, ["رمز الاستلام"]),
              h(OrderQr, { code: o.handoverCode, label: "رمز الاستلام" }),
              h(
                "p",
                {
                  class: "code",
                },
                [o.handoverCode],
              ),
              h(
                "p",
                {
                  class: "muted",
                },
                ["أعطه للمندوب بعد الفحص واستلام قيمة البضاعة فقط."],
              ),
            ],
          )
        : "",
      isOwn && o.returnCode && o.status === "returning" && !o.returnArrived
        ? h("div", { class: "review-group" }, [
            h("h3", {}, ["رمز المرتجع"]),
            h(OrderQr, { code: o.returnCode, label: "رمز المرتجع" }),
            h("p", { class: "code", dir: "ltr" }, [o.returnCode]),
            h("p", { class: "muted" }, [
              "اعرضه للمندوب عند وصوله بالمرتجع. تأكيد الفحص والتسوية يتم بشكل منفصل.",
            ]),
          ])
        : "",
      o.deadline && ["reserved", "approaching"].includes(o.status)
        ? h(
            "p",
            {
              class: "status-note blue",
            },
            [
              "مهلة الوصول حتى ",
              date(o.deadline),
              " — تقدير محلي بناءً على المسافة المباشرة، وليس زمن طريق فعلياً.",
            ],
          )
        : "",
      o.retryAt
        ? row(
            "موعد إعادة المحاولة",
            date(o.retryAt) +
              (o.retryApproved ? " — معتمد" : " — بانتظار الموافقة"),
          )
        : "",
      o.partial
        ? row(
            "الجزء المقترح",
            o.partial.count + " قطع / " + money(o.partial.amount) + " د.ع",
          )
        : "",
      h(
        "div",
        {
          class: "contact-actions",
          style: "margin:14px 0",
        },
        [
          maps(o.sender.location, "موقع الاستلام"),
          !isOwn && o.sender.phone
            ? [
                h(
                  "a",
                  {
                    href: "tel:" + o.sender.phone,
                  },
                  ["اتصال بالمرسل"],
                ),
                h(
                  "a",
                  {
                    target: "_blank",
                    rel: "noopener noreferrer",
                    href: "https://wa.me/964" + (o.sender.phone || "").slice(1),
                  },
                  ["واتساب المرسل"],
                ),
              ]
            : "",
          maps(o.recipient.location, "موقع التسليم"),
          o.courierInfo
            ? [
                h(
                  "a",
                  {
                    href: "tel:" + o.courierInfo.phone,
                  },
                  [icon("phone"), " المندوب"],
                ),
                h(
                  "a",
                  {
                    target: "_blank",
                    rel: "noopener noreferrer",
                    href: "https://wa.me/964" + o.courierInfo.phone.slice(1),
                  },
                  ["واتساب المندوب"],
                ),
              ]
            : "",
          o.recipient.phone
            ? h(
                "a",
                {
                  href: "tel:" + o.recipient.phone,
                },
                [icon("phone"), " المستلم"],
              )
            : "",
          o.courier === state.S.user.id && o.recipient.phone && o.goodsPaid
            ? h(
                "a",
                {
                  target: "_blank",
                  rel: "noopener noreferrer",
                  href:
                    "https://wa.me/964" +
                    o.recipient.phone.slice(1) +
                    "?text=" +
                    encodeURIComponent(
                      "مرحباً، تم استلام طلبك " +
                        o.id +
                        " من " +
                        o.sender.name +
                        ". المندوب: " +
                        (o.courierInfo?.name || "") +
                        "، الهاتف: " +
                        (o.courierInfo?.phone || "") +
                        ". حالة الطلب وقت المشاركة: " +
                        trackingLink(o),
                    ),
                },
                ["تجهيز رسالة الزبون"],
              )
            : "",
        ],
      ),
      o.photo
        ? h(
            "div",
            {
              class: "photo-preview",
            },
            [
              h(
                "img",
                {
                  src: o.photo,
                  alt: "صورة الشحنة",
                },
                [],
              ),
            ],
          )
        : "",
      h(
        "div",
        {
          class: "order-actions",
        },
        [
          availableActions(o).map(([action, label]) =>
            button(
              "order-action",
              label,
              `data-id="${oid}" data-op="${action}"`,
              ["cancel", "release", "delete"].includes(action)
                ? "secondary-button danger"
                : "secondary-button",
            ),
          ),
        ],
      ),
      isOwn && o.status === "published" && offers.length
        ? [
            h(
              "h3",
              {
                class: "section-title",
              },
              ["عروض المندوبين"],
            ),
            offers.map((v) =>
              h(
                "div",
                {
                  class: "detail-row",
                },
                [
                  h("span", {}, [v.name, " — ", money(v.fee), " د.ع"]),
                  button(
                    "order-action",
                    "قبول العرض",
                    `data-id="${oid}" data-op="accept_offer" data-offer="${v.id}"`,
                  ),
                ],
              ),
            ),
          ]
        : "",
      h(
        "h3",
        {
          class: "section-title",
        },
        ["سجل الطلب"],
      ),
      h(
        "ol",
        {
          class: "timeline",
        },
        [
          o.history
            .slice()
            .reverse()
            .map((entry) =>
              h("li", {}, [
                entry.text,
                h("small", {}, [date(entry.at), " • ", entry.actor]),
              ]),
            ),
        ],
      ),
    ]);
  }
  function orderWizard() {
    const {
      state,
      h,
      select,
      input,
      natureNames,
      vehicleNames,
      money,
      coords,
      mergeProps,
      attributes,
      row,
      maps,
      customerDue,
      stepper,
      button,
    } = context();
    if (!state.wizard)
      return h(
        "div",
        {
          class: "empty",
        },
        ["ابدأ طلباً جديداً من شريط التنقل."],
      );
    const d = state.wizard.data,
      r = d.recipient,
      u = state.S.user;
    let fields = "";
    if (state.wizard.step === 0) {
      fields = [
        h(
          "div",
          {
            class: "form-grid",
          },
          [
            d.kind === "free"
              ? select(
                  "collection",
                  "نوع التوصيل الحر",
                  {
                    none: "توصيل فقط دون تحصيل",
                  },
                  d.collection,
                )
              : "",
            input(
              "amount",
              "قيمة البضاعة (د.ع)",
              d.kind === "free" ? 0 : d.amount,
              'type="number" min="0" max="100000000" required' +
                (d.kind === "free" ? " readonly" : ""),
            ),
            input(
              "count",
              "عدد القطع",
              d.count,
              'type="number" min="1" max="1000" required',
            ),
            input(
              "weight",
              "الوزن (كغم)",
              d.weight,
              'type="number" min="0.1" step="0.1" required',
            ),
            input(
              "length",
              "الطول (سم)",
              d.length,
              'type="number" min="1" required',
            ),
            input(
              "width",
              "العرض (سم)",
              d.width,
              'type="number" min="1" required',
            ),
            input(
              "height",
              "الارتفاع (سم)",
              d.height,
              'type="number" min="1" required',
            ),
            select("nature", "طبيعة الشحنة", natureNames, d.nature),
            select("vehicle", "المركبة المناسبة", vehicleNames, d.vehicle),
            select(
              "service",
              "نوع الخدمة",
              {
                normal: "عادي",
                vip: "VIP — مندوب مخصص",
              },
              d.service,
            ),
            input(
              "baseFee",
              "أجرة التوصيل العادي (د.ع)",
              d.baseFee,
              'type="number" min="0" required',
            ),
            select(
              "feePayer",
              "من يتحمل أجرة التوصيل؟",
              {
                customer: "الزبون",
                merchant: "التاجر / المرسل",
              },
              d.feePayer,
            ),
            h("label", { class: "checkbox" }, [
              h(
                "input",
                {
                  type: "checkbox",
                  name: "hasReturn",
                  checked: d.returnFee > 0,
                  onChange: (e) => {
                    e.target.form.elements.returnFee.disabled =
                      !e.target.checked;
                  },
                },
                [],
              ),
              "يتضمن أجرة راجع",
            ]),
            input(
              "returnFee",
              "أجرة الراجع (د.ع)",
              d.returnFee,
              'type="number" min="0" required' +
                (d.returnFee > 0 ? "" : " disabled"),
            ),
          ],
        ),
        h(
          "p",
          {
            class: "status-note blue",
          },
          [
            "تُضاف ",
            money(state.S.settings.vipSurcharge),
            " د.ع لأجرة VIP. أجرة الراجع لا تتجاوز أجرة التوصيل.",
          ],
        ),
      ];
    } else if (state.wizard.step === 1) {
      fields =
        d.kind === "free"
          ? [
              input(
                "senderName",
                "اسم المرسل",
                d.sender.name,
                'required maxlength="80"',
              ),
              input(
                "senderPhone",
                "هاتف المرسل",
                d.sender.phone,
                `required ${PHONE_ATTRIBUTES} autocomplete="tel"`,
              ),
              input(
                "senderAddress",
                "عنوان المرسل",
                d.sender.address,
                'required maxlength="200"',
              ),
              input(
                "senderArea",
                "منطقة المرسل",
                d.sender.area,
                'required maxlength="80"',
              ),
              coords(d.sender.location),
              h("label", {}, [
                "صورة الشحنة من الكاميرا",
                h(
                  "input",
                  mergeProps(
                    {
                      name: "photo",
                      type: "file",
                      accept: "image/*",
                      capture: "environment",
                    },
                    attributes(d.photo ? "" : "required"),
                  ),
                  [],
                ),
              ]),
              d.photo
                ? h(
                    "p",
                    {
                      class: "file-help",
                    },
                    ["صورة مرفقة. اختر صورة أخرى لاستبدالها."],
                  )
                : "",
              h(
                "p",
                {
                  class: "status-note",
                },
                ["التوصيل الحر مقابل أجرة فقط، دون دفع أو تحصيل قيمة البضاعة."],
              ),
            ]
          : [
              h(
                "p",
                {
                  class: "muted",
                },
                [
                  "اختر مكاناً محفوظاً أو أضف مكاناً جديداً؛ يُحفظ تلقائياً عند حفظ الطلب أو نشره.",
                ],
              ),
              select(
                "pickupAddress",
                "عنوان الاستلام",
                {
                  "": "عنوان النشاط الأساسي",
                  new: "إضافة مكان جديد",
                  ...Object.fromEntries(
                    (u.addresses || []).map((a) => [
                      a.id,
                      a.name + " — " + a.address,
                    ]),
                  ),
                },
                d.pickupChoice ?? d.sender.addressId ?? "",
              ),
              row("رقم الحساب", u.id),
              row("اسم النشاط", u.name),
              input("senderArea", "منطقة الاستلام", d.sender.area, 'required maxlength="80"'),
              input("senderAddress", "عنوان الاستلام", d.sender.address, 'required maxlength="200"'),
              row("الهاتف", u.phone),
              h(LocationPanel, { location: d.sender.location, editable: true, required: true, name: "موقع الاستلام" }),
            ];
    } else if (state.wizard.step === 2) {
      fields = [
        h(
          "datalist",
          { id: "recipient-names" },
          (u.customers || [])
            .filter((c) => r.phone && c.phone === r.phone)
            .map((c) => h("option", { value: c.name }, [])),
        ),
        h(
          "datalist",
          { id: "recipient-addresses" },
          (u.customers || [])
            .filter((c) => r.phone && c.phone === r.phone)
            .map((c) => h("option", { value: c.address }, [])),
        ),
        input("phone", "رقم هاتف المستلم", r.phone, `required ${PHONE_ATTRIBUTES} autocomplete="tel"`),
        h("label", {}, [
          "المستلمون والمواقع المحفوظة لهذا الرقم",
          h("select", { name: "savedCustomer" }, [
            h("option", { value: "" }, ["إدخال مستلم أو موقع جديد"]),
            ...(u.customers || []).map((c, i) => h("option", {
              value: String(i), hidden: !r.phone || c.phone !== r.phone,
            }, [c.name + " — " + c.area + " — " + c.address])),
          ]),
        ]),
        h(
          "div",
          {
            class: "form-grid",
          },
          [
            input(
              "name",
              "اسم المستلم",
              r.name,
              'required maxlength="80" autocomplete="name" list="recipient-names"',
            ),
            input(
              "phone2",
              "رقم إضافي (اختياري)",
              r.phone2,
              `${PHONE_ATTRIBUTES} autocomplete="tel"`,
            ),
            input("province", "المحافظة", u.province, "readonly"),
            select(
              "area",
              "المنطقة",
              {
                "": "اختر المنطقة",
                ...Object.fromEntries(
                  (areas[u.province] || []).map((a) => [a, a]),
                ),
                other: "منطقة أخرى",
              },
              (areas[u.province] || []).includes(r.area)
                ? r.area
                : r.area
                  ? "other"
                  : "",
              "required",
            ),
            h(
              "div",
              {
                class: "other-area-field",
                hidden: (areas[u.province] || []).includes(r.area) || !r.area,
              },
              [
                input(
                  "otherArea",
                  "المنطقة الأخرى (عند اختيار أخرى)",
                  r.area,
                  'maxlength="80"',
                ),
              ],
            ),
            input(
              "address",
              "العنوان",
              r.address,
              'required maxlength="200" list="recipient-addresses"',
            ),
            input("landmark", "أقرب نقطة دالة", r.landmark, 'maxlength="200"'),
            h(LocationPanel, { location: r.location, editable: true }),
          ],
        ),
        h("p", { class: "file-help" }, ["تُحفظ بيانات هذا المستلم وموقعه تلقائياً مع الطلب، مع الاحتفاظ ببقية الأسماء والمواقع لنفس الرقم."]),

        h("label", {}, [
          "ملاحظات التوصيل",
          h(
            "textarea",
            {
              name: "notes",
              maxlength: "500",
            },
            [d.notes],
          ),
        ]),
      ];
    } else {
      fields = [
        h(
          "div",
          {
            class: "review-group",
          },
          [
            h("h3", {}, ["المرسل والمستلم"]),
            h("p", {}, [
              d.kind === "free" ? d.sender.name : u.name,
              " ← ",
              r.name,
            ]),
            h("p", {}, [r.province, "، ", r.area, "، ", r.address]),
            h("p", {}, [r.phone, " ", r.phone2 ? " / " + r.phone2 : ""]),
          ],
        ),
        h(
          "div",
          {
            class: "review-group",
          },
          [
            h("h3", {}, ["تفاصيل الشحنة"]),
            h("p", {}, [
              d.count,
              " قطع • ",
              d.weight,
              " كغم • ",
              d.length,
              "×",
              d.width,
              "×",
              d.height,
              " سم",
            ]),
            h("p", {}, [
              natureNames[d.nature],
              " • ",
              vehicleNames[d.vehicle],
              " • ",
              d.service === "vip" ? "VIP" : "عادي",
            ]),
          ],
        ),
        row("قيمة البضاعة", money(d.amount) + " د.ع"),
        row(
          "أجرة التوصيل",
          money(d.fee) +
            " د.ع — على " +
            (d.feePayer === "merchant" ? "التاجر" : "الزبون"),
        ),
        row("أجرة الراجع", money(d.returnFee) + " د.ع"),
        row("المطلوب من الزبون", money(customerDue(d)) + " د.ع"),
        row("الملاحظات", d.notes || "لا توجد"),
        state.wizard.id
          ? h(
              "p",
              {
                class: "status-note",
              },
              [
                "تعديل الطلب المحجوز يلغي الحجز السابق ويعيد نشره، دون احتسابه إلغاءً على المندوب.",
              ],
            )
          : "",
        h(
          "p",
          {
            class: "muted",
          },
          [
            "النشر يجعل الطلب متاحاً للمندوبين المناسبين داخل هذه المنظومة المحلية.",
          ],
        ),
      ];
    }
    return h(
      "section",
      {
        class: "surface wizard",
      },
      [
        stepper(state.wizard.step, ["الشحنة", "المرسل", "المستلم", "المراجعة"]),
        h(
          "h2",
          {
            style: "margin-bottom:16px",
          },
          [
            state.wizard.id
              ? "تعديل الطلب"
              : d.kind === "free"
                ? "طلب توصيل حر"
                : "إنشاء طلب جديد",
          ],
        ),
        h(
          "form",
          {
            id: "order-form",
            class: "form-stack",
          },
          [
            fields,
            h(
              "p",
              {
                class: "inline-error",
                id: "form-error",
              },
              [],
            ),
            h(
              "div",
              {
                class: "wizard-footer",
              },
              [
                state.wizard.step
                  ? button("wizard-back", "السابق")
                  : button("nav", "إلغاء", 'data-screen="home"'),
                state.wizard.step < 3
                  ? h(
                      "button",
                      {
                        class: "primary-button",
                        type: "submit",
                      },
                      ["التالي"],
                    )
                  : [
                      button(
                        "save-order",
                        state.wizard.id ? "حفظ التعديل" : "حفظ دون نشر",
                        'data-publish="false"',
                        "secondary-button",
                      ),
                      state.wizard.id
                        ? ""
                        : button(
                            "save-order",
                            "نشر الطلب",
                            'data-publish="true"',
                            "primary-button",
                          ),
                    ],
              ],
            ),
          ],
        ),
      ],
    );
  }
  function orderActionForm(o, op, extra = {}) {
    const {
      startOrder,
      modal,
      h,
      button,
      fallback,
      state,
      date,
      input,
      select,
      money,
      customerDue,
    } = context();
    if (op === "edit") return startOrder(o.kind, o);
    if (op === "chat") {
      return modal("محادثة " + o.id, [
        h(
          "p",
          {
            class: "muted",
          },
          ["محادثة مستقلة مرتبطة بهذا الطلب فقط."],
        ),
        button("refresh-chat", "تحديث المحادثة", `data-id="${o.id}"`),
        h(
          "div",
          {
            class: "stack",
            style: "margin-top:12px",
          },
          [
            fallback(
              state.S.messages
                .filter((m) => m.orderId === o.id)
                .slice()
                .reverse()
                .map((m) =>
                  h(
                    "div",
                    {
                      class:
                        "chat-message " +
                        (m.owner === state.S.user.id ? "mine" : ""),
                    },
                    [m.text, h("small", {}, [m.name, " • ", date(m.at)])],
                  ),
                ),
              h(
                "p",
                {
                  class: "muted",
                },
                ["لا توجد رسائل بعد."],
              ),
            ),
          ],
        ),
        h(
          "form",
          {
            id: "action-form",
            class: "form-stack",
            "data-id": o.id,
            "data-op": "chat",
            style: "margin-top:14px",
          },
          [
            h("label", {}, [
              "رسالتك",
              h(
                "textarea",
                {
                  name: "text",
                  required: true,
                  maxlength: "2000",
                },
                [],
              ),
            ]),
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
              ["إرسال إلى محادثة الطلب"],
            ),
          ],
        ),
      ]);
    }
    const confirm = (label) =>
      h(
        "label",
        {
          class: "checkbox",
        },
        [
          h(
            "input",
            {
              type: "checkbox",
              name: "confirmed",
              required: true,
            },
            [],
          ),
          label,
        ],
      );
    const contents = {
      publish: "سيظهر الطلب للمندوبين المناسبين في النظام المحلي.",
      unpublish: "سيعود الطلب إلى المسودات ولن يظهر للمندوبين.",
      delete: "سيُحذف الطلب المحفوظ. الطلب المنشور لا يمكن حذفه بهذه الطريقة.",
      cancel: "يُلغى الطلب قبل استلام الشحنة.",
      reserve: "يُحجز الطلب لك وحدك. لا يمكنك حجز طلب ثانٍ حتى استلامه.",
      depart: "تأكيد التوجه إلى التاجر.",
      extend: `يُمدد الحجز مرة واحدة بنسبة ${state.S.settings.extensionPercent}% من المدة الأصلية.`,
      arrive: "تأكيد وصولك إلى موقع الاستلام يوقف مهلة الوصول.",
      wait: "الطلب بانتظار التجهيز أو معالجة اختلاف في البيانات.",
      transit: "تأكيد بدء توصيل الشحنة إلى الزبون.",
      customer_arrive: "تأكيد الوصول إلى عنوان الزبون.",
      approve_retry: "الموافقة على موعد المحاولة المقترح: " + date(o.retryAt),
      return: "تأكيد نقل الطلب إلى مسار الإرجاع.",
      return_start: "تأكيد بدء رحلة الإرجاع.",
      return_arrive: "تأكيد الوصول بالشحنة المرتجعة.",
      partial_approve: "الموافقة على القطع والقيمة المقترحة للتسليم الجزئي.",
    };
    let fields = contents[op] ? h("p", {}, [contents[op]]) : "";
    if (op === "extend")
      fields = [
        input(
          "minutes",
          "دقائق التمديد",
          "1",
          `type="number" min="1" max="${Math.ceil(((o.originalMinutes || 5) * state.S.settings.extensionPercent) / 100)}" required`,
        ),
        input("reason", "سبب التمديد", "", 'required maxlength="300"'),
        h("p", {}, ["يُعاد النشر إن لم يوافق التاجر خلال دقيقة."]),
      ];
    if (op === "arrive")
      fields = [
        input(
          "reason",
          "سبب الوصول اليدوي إذا تعذر GPS",
          "",
          'maxlength="300"',
        ),
        h("p", {}, ["يُقبل GPS ضمن نطاق الوصول؛ خارج النطاق يجب توضيح السبب."]),
      ];
    if (
      [
        "complete",
        "keep_edit",
        "decline_edit",
        "approve_extension",
        "reject_extension",
      ].includes(op)
    )
      fields = confirm("راجعت البيانات وأؤكد هذا الإجراء.");
    if (op === "raise_fee" || op === "offer")
      fields = input(
        "fee",
        "أجرة التوصيل المقترحة (د.ع)",
        op === "raise_fee" ? o.fee + 1000 : o.fee,
        'type="number" min="1" required',
      );
    if (op === "release" || op === "fail")
      fields = [
        select(
          "reason",
          "السبب",
          {
            "": "اختر السبب",
            "عدم الرد أو إغلاق الهاتف": "عدم الرد أو إغلاق الهاتف",
            "عدم وجود الزبون": "عدم وجود الزبون",
            "خطأ في العنوان": "خطأ في العنوان",
            "رفض الاستلام أو الدفع": "رفض الاستلام أو الدفع",
            "اختلاف أو مشكلة في الشحنة": "اختلاف أو مشكلة في الشحنة",
            "سبب آخر": "سبب آخر",
          },
          "",
          "required",
        ),
        input("reasonDetails", "التوضيح", "", 'maxlength="300"'),
      ];
    if (op === "pickup")
      fields = [
        h(
          "p",
          {
            class: "status-note",
          },
          [
            "المطلوب دفعه للمرسل: ",
            money(o.kind === "free" ? 0 : o.amount),
            " د.ع",
          ],
        ),
        h(
          "label",
          {
            class: "checkbox",
          },
          [
            h(
              "input",
              {
                type: "checkbox",
                name: "inspected",
                required: true,
              },
              [],
            ),
            "راجعت عدد القطع والتغليف والمطابقة وعالجت أي اختلاف.",
          ],
        ),
        h(
          "label",
          {
            class: "checkbox",
          },
          [
            h(
              "input",
              {
                type: "checkbox",
                name: "paid",
                required: true,
              },
              [],
            ),
            "دفعت القيمة المستحقة وتسلمت الشحنة.",
          ],
        ),
        h(ScanCodeField, {
          key: `${o.id}-pickup`,
          label: "رمز الاستلام من التاجر (أو أدخله يدوياً)",
        }),
      ];
    if (op === "return_arrive")
      fields = [
        h("p", { class: "status-note" }, [
          "امسح رمز المرتجع من التاجر عند الوصول، أو أدخل الرمز يدوياً. هذا لا يغلق التسوية المالية.",
        ]),
        h(ScanCodeField, {
          key: `${o.id}-return`,
          label: "رمز المرتجع من التاجر",
        }),
      ];
    if (op === "deliver")
      fields = [
        h(
          "p",
          {
            class: "status-note blue",
          },
          ["المطلوب من الزبون: ", money(customerDue(o)), " د.ع"],
        ),
        confirm("تم تسليم الشحنة وتحصيل المبلغ أعلاه."),
        h("label", {}, [
          "وصف إثبات التسليم",
          h(
            "textarea",
            {
              name: "proof",
              minlength: "8",
              required: true,
              placeholder: "وصف التأكيد في البيئة التجريبية",
            },
            [],
          ),
        ]),
        h(
          "p",
          {
            class: "file-help",
          },
          [
            "لا توجد رسالة SMS فعلية؛ الإثبات هنا وصف محلي يحتاج ربط مزود تحقق قبل التشغيل.",
          ],
        ),
      ];
    if (op === "retry")
      fields = input(
        "when",
        "الموعد المقترح",
        "",
        'type="datetime-local" required',
      );
    if (op === "receive_return")
      fields = h(
        "label",
        {
          class: "checkbox",
        },
        [
          h(
            "input",
            {
              type: "checkbox",
              name: "inspected",
              required: true,
            },
            [],
          ),
          "فحصت القطع المرتجعة واستلمتها. تبقى التسوية المالية مفتوحة.",
        ],
      );
    if (op === "settle_return")
      fields = [
        h("p", {}, [
          "قيمة البضاعة الواجب استردادها: ",
          money(
            o.goodsPaid
              ? o.amount - (o.partialDelivered ? o.partial.amount : 0)
              : 0,
          ),
          " د.ع",
        ]),
        input(
          "fees",
          "أجور الذهاب والراجع المسواة",
          Number(o.returnFee) +
            (o.partialDelivered && o.feePayer === "customer"
              ? 0
              : Number(o.fee)),
          'type="number" min="0" required',
        ),
        confirm(
          "استرددت قيمة المرتجع وسُويت الأجور. هذا تأكيد محلي لا ينفذ تحويلاً.",
        ),
      ];
    if (op === "settle_delivery")
      fields = [
        h("p", {}, [
          "أجرة على المرسل: ",
          money(o.feePayer === "merchant" ? o.fee : 0),
          " د.ع. قيمة تحصيل تُعاد للمرسل: ",
          money(o.kind === "free" ? o.amount : 0),
          " د.ع.",
        ]),
        confirm("اكتملت تسوية هذه المبالغ مع المرسل."),
      ];
    if (op === "partial_propose")
      fields = [
        input(
          "count",
          "عدد القطع المسلمة",
          "",
          'type="number" min="1" required',
        ),
        input(
          "amount",
          "قيمة الجزء المسلم",
          "",
          'type="number" min="1" required',
        ),
      ];
    if (op === "partial_confirm")
      fields = confirm(
        "سلمت الجزء المعتمد وحصلت قيمته مع أجرة التوصيل إذا كانت على الزبون.",
      );
    if (op === "rate")
      fields = [
        select(
          "stars",
          "التقييم",
          {
            5: "★★★★★",
            4: "★★★★",
            3: "★★★",
            2: "★★",
            1: "★",
          },
          "5",
        ),
        h("label", {}, [
          "ملاحظتك",
          h(
            "textarea",
            {
              name: "text",
              maxlength: "500",
            },
            [],
          ),
        ]),
      ];
    if (op === "accept_offer")
      fields = h("p", {}, [
        "قبول هذا العرض يثبت الأجرة ويحجز الطلب إن بقي متاحاً وكان المندوب مؤهلاً.",
      ]);
    modal(
      "إجراء على " + o.id,
      h(
        "form",
        {
          id: "action-form",
          class: "form-stack",
          "data-id": o.id,
          "data-op": op,
          "data-offer": extra.offer || "",
        },
        [
          fields,
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
            ["تأكيد"],
          ),
        ],
      ),
    );
  }
  function mapPlot(groups) {
    const { h } = context();
    return h(LocationMap, { groups }, []);
  }
  function localMap(couriers = false) {
    const { state, baseOrders, modal, h, mapPlot, fallback, maps, button, vehicleNames } =
      context();
    const groups = couriers
      ? state.S.couriers.map((c) => ({
          id: c.id,
          name: c.name,
          vehicle: c.vehicle,
          cooling: c.cooling,
          vehicleLabel: c.cooling === "frozen"
            ? "براد — تجميد"
            : c.cooling === "chilled"
              ? "سيارة تبريد"
              : vehicleNames[c.vehicle] || c.vehicle,
          location: c.location,
          count: 1,
        }))
      : Object.values(
          baseOrders().reduce((a, o) => {
            const key =
              o.merchant +
              ":" +
              (o.sender.addressId ||
                o.sender.address ||
                JSON.stringify(o.sender.location));
            a[key] ??= {
              id: key,
              name: o.sender.name,
              location: o.sender.location,
              count: 0,
              ids: [],
            };
            a[key].vip ||= o.service === "vip";
            a[key].count++;
            a[key].ids.push(o.id);
            return a;
          }, {}),
        );
    modal(couriers ? "مواقع المناديب المسجلة" : "طلبات كل موقع", [
      h(
        "p",
        {
          class: "muted",
        },
        [
          "إحداثيات محفوظة؛ تحديث حركة المندوب يتم عند إرسال موقعه. تجميع العلامة لا يحجز الطلبات.",
        ],
      ),
      mapPlot(groups),
      h(
        "div",
        {
          class: "map-list",
        },
        [
          fallback(
            groups.map((g) =>
              h(
                "div",
                {
                  class: "map-pin" + (g.vip ? " vip-order" : ""),
                  id: "map-group-" + g.id,
                },
                [
                  h("div", { class: "map-pin-heading" }, [
                    h("h3", {}, [g.name]),
                    g.vehicleLabel ? h("span", { class: "muted" }, [g.vehicleLabel]) : null,
                    h("span", { class: "number" }, [g.count]),
                  ]),
                  h(
                    "p",
                    {
                      class: "info-line map-pin-coordinates",
                      dir: "ltr",
                    },
                    [
                      g.location.lat.toFixed(4),
                      ", ",
                      g.location.lng.toFixed(4),
                    ],
                  ),
                  h(
                    "div",
                    {
                      class: "contact-actions map-pin-actions",
                    },
                    [
                      maps(g.location, "فتح الخريطة", true),
                      g.location
                        ? h(LocationShare, {
                            location: g.location,
                            name: g.name,
                          })
                        : "",
                    ],
                  ),
                  g.ids
                    ? h(
                        "div",
                        {
                          class: "map-pin-orders",
                          "aria-label": "طلبات الموقع",
                        },
                        g.ids.map((id) =>
                          button("order", id, `data-id="${id}"`),
                        ),
                      )
                    : "",
                ],
              ),
            ),
            h("p", {}, ["لا توجد مواقع متاحة."]),
          ),
        ],
      ),
    ]);
  }
  return {
    homeView,
    statusPicker,
    baseOrders,
    ordersView,
    orderList,
    availableActions,
    orderDetail,
    orderWizard,
    orderActionForm,
    mapPlot,
    localMap,
  };
}
