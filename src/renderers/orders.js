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
    return [
      h(
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
          u.role === "merchant"
            ? h(
                "div",
                {
                  class: "order-strip",
                  style: "margin-top:14px",
                },
                [
                  h("div", {}, [
                    h("strong", {}, [
                      state.S.couriers.length,
                      " مناديب متاحين ضمن20 كم",
                    ]),
                    h(
                      "p",
                      {
                        class: "muted",
                      },
                      ["حسب آخر موقع مسجل في النسخة المحلية"],
                    ),
                  ]),
                  button("nearby", "عرض المواقع"),
                ],
              )
            : [
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
          metric("شحنات نشطة", active, "بعهدة المندوب", "local_shipping"),
          metric(
            "قبل الاستلام",
            pickup,
            "حجوزات قيد المتابعة",
            "inventory_2",
            "orange",
          ),
          metric(
            "رصيد المحفظة",
            money(state.S.balance),
            "د.ع • منفصل عن قيمة البضاعة",
            "payments",
          ),
          metric(
            "تعذر ومرتجعات",
            returns,
            "تحتاج متابعة وتسوية",
            "assignment_return",
            "red",
          ),
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
                  class: "section-title",
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
      orderList(
        own
          .filter((o) =>
            state.filter === "all"
              ? !closed.includes(o.status)
              : o.status === state.filter,
          )
          .slice(0, 10),
      ),
      u.role === "merchant"
        ? h(
            "section",
            {
              class: "express-card",
              "aria-labelledby": "express-title",
            },
            [
              h(
                "div",
                {
                  class: "express-copy",
                },
                [
                  h(
                    "div",
                    {
                      class: "express-heading",
                    },
                    [
                      h(
                        "span",
                        {
                          class: "express-badge",
                        },
                        ["شحن", h("br", {}, []), "فوري"],
                      ),
                      h(
                        "h3",
                        {
                          id: "express-title",
                        },
                        ["توصيل حر", h("br", {}, []), "ومستعجل؟"],
                      ),
                    ],
                  ),
                  h("p", {}, [
                    "احجز أقرب كابتن فوري لشحنة",
                    h(
                      "br",
                      {
                        class: "express-break",
                      },
                      [],
                    ),
                    " سريعة بدون جدولة زمنية.",
                  ]),
                ],
              ),
              button(
                "new-free",
                [
                  "طلب كابتن ",
                  h(
                    "svg",
                    {
                      viewBox: "0 0 24 24",
                      fill: "none",
                      "aria-hidden": "true",
                    },
                    [
                      h(
                        "path",
                        {
                          d: "M3 4l18 8-18 8V4Zm0 8h18",
                          stroke: "currentColor",
                          "stroke-width": "2.5",
                          "stroke-linejoin": "round",
                        },
                        [],
                      ),
                    ],
                  ),
                ],
                "",
                "express-button",
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
            h("span", {}, [state.S.statuses[state.filter] || "جميع الحالات"]),
            h(
              "span",
              {
                class: "status-trigger-count",
              },
              [
                baseOrders().filter(
                  (o) => state.filter === "all" || o.status === state.filter,
                ).length,
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
      orderList(os),
    ];
  }
  function orderList(os) {
    const { h, icon, state, vehicleNames, money, button } = context();
    return os.length
      ? os.map((o) =>
          h(
            "article",
            {
              class: "order-card",
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
                          class: "chip pickup",
                        },
                        ["VIP"],
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
      add("offer", "اقتراح أجرة");
    }
    if (assigned) {
      if (o.status === "reserved") add("depart", "أنا في الطريق");
      if (["reserved", "approaching"].includes(o.status)) {
        add("arrive", "وصلت إلى موقع الاستلام");
        if (!o.extended) add("extend", "تمديد المهلة");
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
        if (o.attempts < state.S.settings.maxAttempts)
          add("retry", "اقتراح إعادة المحاولة");
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
    activeOrder = oid;
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
          !isOwn
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
                    href: "https://wa.me/964" + o.sender.phone.slice(1),
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
          isOwn && o.recipient.phone && !before.includes(o.status)
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
                      "تم تسليم طلبك " +
                        o.id +
                        " إلى المندوب وهو الآن في طريقه إليك.",
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
            .map((h) =>
              h("li", {}, [
                h.text,
                h("small", {}, [date(h.at), " • ", h.actor]),
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
                    collect: "توصيل مع تحصيل مبلغ",
                  },
                  d.collection,
                )
              : "",
            input(
              "amount",
              "قيمة البضاعة (د.ع)",
              d.amount,
              'type="number" min="0" max="100000000" required',
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
            input(
              "returnFee",
              "أجرة الراجع (د.ع)",
              d.returnFee,
              'type="number" min="0" required',
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
                'required type="tel" dir="ltr"',
              ),
              input(
                "senderAddress",
                "عنوان المرسل",
                d.sender.address,
                'required maxlength="200"',
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
                [
                  "لا يُدفع مبلغ الشحنة للمرسل مقدماً في التوصيل الحر؛ هذه السياسة بانتظار اعتماد مستقل.",
                ],
              ),
            ]
          : [
              h(
                "p",
                {
                  class: "muted",
                },
                [
                  "تُعبّأ هذه البيانات من الملف المعتمد، ويرتبط الطلب بموقع النشاط المحفوظ.",
                ],
              ),
              row("المعرف الثابت", u.id),
              row("اسم النشاط", u.name),
              row("المحافظة والمنطقة", u.province + " — " + u.area),
              row("العنوان", u.address),
              row("الهاتف", u.phone),
              row("هاتف احتياطي", u.phone2 || "غير مضاف"),
              h(
                "div",
                {
                  class: "contact-actions",
                },
                [maps(u.location)],
              ),
            ];
    } else if (state.wizard.step === 2) {
      fields = [
        (u.customers || []).length
          ? select(
              "savedCustomer",
              "استخدام بيانات زبون سابق",
              {
                "": "زبون جديد",
                ...Object.fromEntries(
                  u.customers.map((r, i) => [
                    String(i),
                    r.name + " — " + r.phone,
                  ]),
                ),
              },
              "",
            )
          : "",
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
              'required maxlength="80" autocomplete="name"',
            ),
            input(
              "phone",
              "رقم الهاتف",
              r.phone,
              'required type="tel" dir="ltr"',
            ),
            input(
              "phone2",
              "رقم إضافي (اختياري)",
              r.phone2,
              'type="tel" dir="ltr"',
            ),
            input("province", "المحافظة", u.province, "readonly"),
            input("area", "المنطقة", r.area, 'required maxlength="80"'),
            input("address", "العنوان", r.address, 'required maxlength="200"'),
            input("landmark", "أقرب نقطة دالة", r.landmark, 'maxlength="200"'),
            input(
              "lat",
              "خط عرض المستلم (اختياري)",
              r.location?.lat ?? "",
              'type="number" step="any"',
            ),
            input(
              "lng",
              "خط طول المستلم (اختياري)",
              r.location?.lng ?? "",
              'type="number" step="any"',
            ),
          ],
        ),
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
        input(
          "code",
          "رمز الاستلام من التاجر",
          "",
          'required inputmode="numeric" pattern="[0-9]{6}" maxlength="6"',
        ),
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
          money(o.goodsPaid ? o.amount - (o.partial?.amount || 0) : 0),
          " د.ع",
        ]),
        input(
          "fees",
          "أجور الذهاب والراجع المسواة",
          o.fee + o.returnFee,
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
        "سلمت الجزء المعتمد وحصلت قيمته دون الأجور. تُسوّى الأجور مع الإرجاع.",
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
    if (!groups.length) return "";
    const lats = groups.map((g) => g.location.lat),
      lngs = groups.map((g) => g.location.lng),
      minLat = Math.min(...lats) - 0.005,
      maxLat = Math.max(...lats) + 0.005,
      minLng = Math.min(...lngs) - 0.005,
      maxLng = Math.max(...lngs) + 0.005;
    return h(
      "div",
      {
        class: "coordinate-map",
      },
      [
        h(
          "svg",
          {
            viewBox: "0 0 600 230",
            role: "img",
            "aria-label": "مخطط مواقع تقريبي حسب الإحداثيات",
          },
          [
            h(
              "rect",
              {
                width: "600",
                height: "230",
                rx: "16",
                fill: "#eff4ff",
              },
              [],
            ),
            h(
              "path",
              {
                d: "M0 57H600M0 115H600M0 173H600M150 0V230M300 0V230M450 0V230",
                stroke: "#d8e5f1",
                "stroke-width": "1",
              },
              [],
            ),
            groups.map((g) => {
              const x =
                  40 + ((g.location.lng - minLng) / (maxLng - minLng)) * 520,
                y = 35 + ((maxLat - g.location.lat) / (maxLat - minLat)) * 150;
              return h("g", {}, [
                h(
                  "circle",
                  {
                    cx: x,
                    cy: y,
                    r: "18",
                    fill: "#f47d2f",
                  },
                  [],
                ),
                h(
                  "text",
                  {
                    x: x,
                    y: y + 5,
                    "text-anchor": "middle",
                    fill: "white",
                    "font-size": "14",
                    "font-weight": "700",
                  },
                  [g.count],
                ),
                h(
                  "text",
                  {
                    x: x,
                    y: y + 38,
                    "text-anchor": "middle",
                    fill: "#00567a",
                    "font-size": "11",
                  },
                  [g.name],
                ),
              ]);
            }),
          ],
        ),
        h(
          "p",
          {
            class: "file-help",
          },
          [
            "مخطط إحداثيات تقريبي، لا يعرض الطرق. افتح الموقع في الخرائط للملاحة.",
          ],
        ),
      ],
    );
  }
  function localMap(couriers = false) {
    const { state, baseOrders, modal, h, mapPlot, fallback, maps, button } =
      context();
    const groups = couriers
      ? state.S.couriers.map((c) => ({
          id: c.id,
          name: c.name,
          location: c.location,
          count: 1,
        }))
      : Object.values(
          baseOrders().reduce((a, o) => {
            a[o.merchant] ??= {
              id: o.merchant,
              name: o.sender.name,
              location: o.sender.location,
              count: 0,
              ids: [],
            };
            a[o.merchant].count++;
            a[o.merchant].ids.push(o.id);
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
                  class: "map-pin",
                },
                [
                  h(
                    "span",
                    {
                      class: "number",
                    },
                    [g.count],
                  ),
                  h("h3", {}, [g.name]),
                  h(
                    "p",
                    {
                      class: "info-line",
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
                      class: "contact-actions",
                    },
                    [maps(g.location)],
                  ),
                  g.ids
                    ? g.ids.map((id) => button("order", id, `data-id="${id}"`))
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
