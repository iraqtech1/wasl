export function createUiRenderers(context) {
  function row(label, value) {
    const { h } = context();
    return h(
      "div",
      {
        class: "detail-row",
      },
      [h("span", {}, [label]), h("strong", {}, [value])],
    );
  }
  function button(action, label, extra = "", kind = "secondary-button") {
    const { h, mergeProps, attributes } = context();
    return h(
      "button",
      mergeProps(
        {
          type: "button",
          class: kind,
          "data-action": action,
        },
        attributes(extra),
      ),
      [label],
    );
  }
  function input(name, label, value = "", attrs = "") {
    const { h, mergeProps, attributes } = context();
    return h("label", {}, [
      label,
      h(
        "input",
        mergeProps(
          {
            name: name,
            value: value,
          },
          attributes(attrs),
        ),
        [],
      ),
    ]);
  }
  function select(name, label, values, value, attrs = "") {
    const { h, mergeProps, attributes } = context();
    return h("label", {}, [
      label,
      h(
        "select",
        mergeProps(
          {
            name: name,
          },
          attributes(attrs),
        ),
        [
          Object.entries(values).map(([v, t]) =>
            h(
              "option",
              mergeProps(
                {
                  value: v,
                },
                attributes(v === value ? "selected" : ""),
              ),
              [t],
            ),
          ),
        ],
      ),
    ]);
  }
  function stepper(step, labels) {
    const { h } = context();
    return h(
      "ol",
      {
        class: "wizard-steps",
      },
      [
        labels.map((label, i) =>
          h(
            "li",
            {
              class: i === step ? "active" : "",
            },
            [h("span", {}, [i < step ? "✓" : i + 1]), label],
          ),
        ),
      ],
    );
  }
  function coords(loc, readonly = false) {
    const { h, input, button, icon } = context();
    return [
      h(
        "div",
        {
          class: "form-grid",
        },
        [
          input(
            "lat",
            "خط العرض",
            loc?.lat ?? "",
            `type="number" step="any" required ${readonly ? "readonly" : ""}`,
          ),
          input(
            "lng",
            "خط الطول",
            loc?.lng ?? "",
            `type="number" step="any" required ${readonly ? "readonly" : ""}`,
          ),
        ],
      ),
      readonly
        ? ""
        : button("gps", [icon("my_location"), " تحديد موقعي الحالي"]),
      h(
        "p",
        {
          class: "file-help",
        },
        [
          "الموقع محفوظ بإحداثياته. فتح الخرائط لا يحتاج مشاركة الموقع مع التطبيق.",
        ],
      ),
    ];
  }
  function maps(loc, label = "فتح الموقع بالخرائط") {
    const { h, icon } = context();
    return loc
      ? h(
          "a",
          {
            target: "_blank",
            rel: "noopener noreferrer",
            href:
              "https://www.google.com/maps/search/?api=1&query=" +
              encodeURIComponent(loc.lat + "," + loc.lng),
          },
          [icon("location_on"), " ", label],
        )
      : "";
  }
  function splashBike() {
    const { h } = context();
    return h(
      "g",
      {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
      [
        h(
          "circle",
          {
            cx: "22",
            cy: "53",
            r: "10",
            fill: "#fff",
            stroke: "#00567a",
            "stroke-width": "5",
          },
          [],
        ),
        h(
          "circle",
          {
            cx: "80",
            cy: "53",
            r: "10",
            fill: "#fff",
            stroke: "#00567a",
            "stroke-width": "5",
          },
          [],
        ),
        h(
          "path",
          {
            d: "M10 43q10-16 25-8l13 9h16l8-22h8l5 23H64l-8 11H39q-1-16-21-13",
            fill: "#f47d2f",
          },
          [],
        ),
        h(
          "path",
          {
            d: "m76 24-5-8h-9",
            stroke: "#00567a",
            "stroke-width": "4",
          },
          [],
        ),
        h(
          "path",
          {
            d: "m48 27-9 9 15 4-2 11h9l3-17-10-7",
            fill: "#004460",
          },
          [],
        ),
        h(
          "path",
          {
            d: "m46 12-9 16h19l4-12",
            fill: "#00567a",
          },
          [],
        ),
        h(
          "path",
          {
            d: "m56 17 7 10 10-2",
            stroke: "#00567a",
            "stroke-width": "6",
          },
          [],
        ),
        h(
          "circle",
          {
            cx: "53",
            cy: "7",
            r: "7",
            fill: "#f0b78e",
          },
          [],
        ),
        h(
          "path",
          {
            d: "M45 7c-2-13 19-13 18 0Z",
            fill: "#00567a",
          },
          [],
        ),
        h(
          "path",
          {
            d: "M54 0q6 1 7 7",
            stroke: "#f47d2f",
            "stroke-width": "3",
          },
          [],
        ),
        h(
          "rect",
          {
            x: "18",
            y: "15",
            width: "20",
            height: "19",
            rx: "3",
            fill: "#00567a",
          },
          [],
        ),
        h(
          "path",
          {
            d: "M28 15v19",
            stroke: "#f47d2f",
            "stroke-width": "4",
          },
          [],
        ),
      ],
    );
  }
  function routeLines() {
    const { h } = context();
    return h(
      "svg",
      {
        class: "entry-route",
        viewBox: "0 0 320 100",
        fill: "none",
        "aria-hidden": "true",
      },
      [
        h(
          "path",
          {
            class: "route-base",
            d: "M24 76h65c42 0 26-44 70-44h55c40 0 30 44 77 44",
          },
          [],
        ),
        h(
          "path",
          {
            class: "route-progress",
            d: "M24 76h65c42 0 26-44 70-44h55c40 0 30 44 77 44",
          },
          [],
        ),
        h(
          "circle",
          {
            cx: "24",
            cy: "76",
            r: "7",
          },
          [],
        ),
        h(
          "circle",
          {
            cx: "291",
            cy: "76",
            r: "7",
          },
          [],
        ),
        h(
          "g",
          {
            class: "route-package",
          },
          [
            h(
              "g",
              {
                transform: "translate(0,-13)",
                "stroke-linejoin": "round",
              },
              [
                h(
                  "path",
                  {
                    d: "M0-13 12-7v14L0 13-12 7V-7Z",
                    fill: "#f47d2f",
                    stroke: "#fff",
                    "stroke-width": "1.5",
                  },
                  [],
                ),
                h(
                  "path",
                  {
                    d: "M-12-7 0-1 12-7M0-1v14",
                    stroke: "#00567a",
                    "stroke-width": "1.5",
                  },
                  [],
                ),
                h(
                  "path",
                  {
                    d: "m-6-10 12 6v5",
                    stroke: "#fff0e5",
                    "stroke-width": "3",
                  },
                  [],
                ),
              ],
            ),
            h(
              "animateMotion",
              {
                dur: "2.6s",
                repeatCount: "indefinite",
                path: "M24 76h65c42 0 26-44 70-44h55c40 0 30 44 77 44",
              },
              [],
            ),
          ],
        ),
      ],
    );
  }
  function splashScenery() {
    const { h, splashBike } = context();
    return [
      h(
        "svg",
        {
          class: "splash-sky",
          viewBox: "0 0 420 100",
          fill: "none",
          "aria-hidden": "true",
        },
        [
          h(
            "g",
            {
              stroke: "#00567a",
              "stroke-width": "1.5",
              opacity: ".22",
            },
            [
              h(
                "path",
                {
                  d: "M27 48h60c13 0 13-17 1-18-2-23-35-24-39-5-19-4-26 12-22 23Z",
                },
                [],
              ),
              h(
                "path",
                {
                  d: "M297 37h58c16 0 15-19 0-20-6-17-26-17-33-3-16-5-28 9-25 23Z",
                },
                [],
              ),
              h(
                "path",
                {
                  d: "m184 30 9-9 9 9v15h-18Z",
                },
                [],
              ),
              h(
                "path",
                {
                  d: "M191 45V34h5v11",
                },
                [],
              ),
            ],
          ),
          h(
            "g",
            {
              stroke: "#f47d2f",
              "stroke-width": "2",
              opacity: ".55",
            },
            [
              h(
                "path",
                {
                  d: "M125 67h12m-6-6v12M270 61h10m-5-5v10",
                },
                [],
              ),
              h(
                "circle",
                {
                  cx: "364",
                  cy: "72",
                  r: "4",
                },
                [],
              ),
            ],
          ),
        ],
      ),
      h(
        "svg",
        {
          class: "splash-city",
          viewBox: "0 0 600 160",
          fill: "none",
          "aria-hidden": "true",
        },
        [
          h(
            "g",
            {
              fill: "#00567a",
              opacity: ".08",
            },
            [
              h(
                "path",
                {
                  d: "M0 130V76h45v54m13 0V42h48v88m15 0V64h49v66m245 0V58h51v72m15 0V31h45v99m14 0V81h60v49",
                },
                [],
              ),
              h(
                "path",
                {
                  d: "M70 42V28h22v14m400-11V17h22v14",
                },
                [],
              ),
            ],
          ),
          h(
            "g",
            {
              stroke: "#00567a",
              opacity: ".15",
              "stroke-width": "2",
            },
            [
              h(
                "path",
                {
                  d: "M0 133h600M69 57h26m-26 14h26m330 4h30m-30 14h30M492 48h22m-22 15h22",
                },
                [],
              ),
            ],
          ),
          h(
            "path",
            {
              class: "city-road",
              d: "M0 150h600",
              stroke: "#f47d2f",
              "stroke-width": "2",
              "stroke-dasharray": "18 20",
              opacity: ".38",
            },
            [],
          ),
          h(
            "g",
            {
              class: "city-rider",
            },
            [
              h(
                "g",
                {
                  transform: "translate(220,59) scale(1.15)",
                },
                [splashBike()],
              ),
            ],
          ),
        ],
      ),
    ];
  }
  function navIcon(key) {
    const { h } = context();
    const paths = {
      home: h(
        "path",
        {
          d: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
        },
        [],
      ),
      registry: [
        h(
          "rect",
          {
            x: "5",
            y: "3",
            width: "14",
            height: "18",
            rx: "3",
          },
          [],
        ),
        h(
          "path",
          {
            d: "M9 8h6M9 12h6M9 16h3",
          },
          [],
        ),
      ],
      new: h(
        "path",
        {
          d: "M12 5v14M5 12h14",
        },
        [],
      ),
      wallet: [
        h(
          "path",
          {
            d: "M20 8V6a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v10H6a3 3 0 0 1-3-3V7",
          },
          [],
        ),
        h(
          "path",
          {
            d: "M20 12h-5a2 2 0 0 0 0 4h5",
          },
          [],
        ),
      ],
      account: [
        h(
          "circle",
          {
            cx: "12",
            cy: "8",
            r: "4",
          },
          [],
        ),
        h(
          "path",
          {
            d: "M4 21v-2a8 8 0 0 1 16 0v2",
          },
          [],
        ),
      ],
      available: [
        h(
          "path",
          {
            d: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z",
          },
          [],
        ),
        h(
          "circle",
          {
            cx: "12",
            cy: "10",
            r: "2.5",
          },
          [],
        ),
      ],
    };
    return h(
      "span",
      {
        class: "nav-symbol",
      },
      [
        h(
          "svg",
          {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "1.8",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "aria-hidden": "true",
          },
          [paths[key]],
        ),
      ],
    );
  }
  function metric(label, value, caption, ic, color = "") {
    const { h, icon } = context();
    return h(
      "div",
      {
        class: "metric " + color,
      },
      [
        h(
          "div",
          {
            class: "metric-label",
          },
          [label, icon(ic)],
        ),
        h(
          "div",
          {
            class: "metric-value",
          },
          [value],
        ),
        h("small", {}, [caption]),
      ],
    );
  }
  function ledger(items) {
    const { h, money, date } = context();
    if (!items.length)
      return h(
        "p",
        {
          class: "muted",
          style: "margin-top:12px",
        },
        "لا توجد حركات مسجلة.",
      );
    const rows = items.map((r, i) =>
      h(
        "tr",
        {
          key: r.id || i,
        },
        [
          h("td", r.reason),
          h(
            "td",
            {
              class: r.amount >= 0 ? "positive" : "negative",
              dir: "ltr",
            },
            money(r.amount),
          ),
          h("td", [r.orderId || "—", h("br"), h("small", date(r.at))]),
        ],
      ),
    );
    const head = h("thead", [
      h(
        "tr",
        ["البيان", "المبلغ", "الطلب والتاريخ"].map((label) => h("th", label)),
      ),
    ]);
    return h(
      "div",
      {
        style: "overflow:auto",
      },
      [
        h(
          "table",
          {
            class: "ledger",
          },
          [head, h("tbody", rows)],
        ),
      ],
    );
  }
  return {
    button,
    input,
    select,
    row,
    stepper,
    coords,
    maps,
    metric,
    ledger,
    navIcon,
    splashBike,
    splashScenery,
    routeLines,
  };
}
