// ПРИНУДИТЕЛЬНОЕ исправление таблиц - удаляем ВСЕ ограничения

document.addEventListener("DOMContentLoaded", function () {
    function forceFixTables() {
        const tables = document.querySelectorAll(".table");

        tables.forEach((table) => {
            // Пропускаем таблицы в сайдбаре
            if (
                table.closest(".aside, .sidebar, .nav-sidebar, .orchid-aside")
            ) {
                return;
            }
            // Анализируем содержимое колонок
            const headers = table.querySelectorAll("th");
            const columnHasLongContent = [];

            headers.forEach((header, colIndex) => {
                const cells = table.querySelectorAll(
                    `tr td:nth-child(${colIndex + 1})`
                );
                let maxLength = 0;

                cells.forEach((cell) => {
                    const text = cell.textContent.trim();
                    maxLength = Math.max(maxLength, text.length);
                });

                columnHasLongContent[colIndex] = maxLength > 50;
            });
            // Принудительно устанавливаем table-layout
            table.style.setProperty("table-layout", "auto", "important");
            table.style.setProperty("width", "100%", "important");

            // Принудительно растягиваем контейнеры
            const tableResponsive = table.closest(".table-responsive");
            if (tableResponsive) {
                tableResponsive.style.setProperty("width", "100%", "important");
                tableResponsive.style.setProperty(
                    "max-width",
                    "100%",
                    "important"
                );
                tableResponsive.style.setProperty("margin", "0", "important");
                tableResponsive.style.setProperty("padding", "0", "important");
            }

            const cardContainer = table.closest(".bg-white, .card, .rounded");
            if (cardContainer) {
                cardContainer.style.setProperty("width", "100%", "important");
                cardContainer.style.setProperty(
                    "max-width",
                    "100%",
                    "important"
                );
                cardContainer.style.setProperty(
                    "box-sizing",
                    "border-box",
                    "important"
                );
            }

            // Находим все ячейки
            const allCells = table.querySelectorAll("th, td");

            allCells.forEach((cell, index) => {
                // Определяем, это первая колонка или нет
                const row = cell.parentElement;
                const cellIndex = Array.from(row.children).indexOf(cell);

                if (cellIndex === 0) {
                    // Первая колонка - оставляем фиксированной для ID
                    cell.style.setProperty("width", "80px", "important");
                    cell.style.setProperty("min-width", "80px", "important");
                    cell.style.setProperty("max-width", "80px", "important");
                    cell.style.setProperty(
                        "white-space",
                        "nowrap",
                        "important"
                    );
                    cell.style.setProperty("text-align", "center", "important");
                } else {
                    // Все остальные колонки - убираем ВСЕ ограничения
                    cell.style.removeProperty("width");
                    cell.style.removeProperty("min-width");
                    cell.style.removeProperty("max-width");

                    // Используем анализ всей колонки
                    const isLongContentColumn = columnHasLongContent[cellIndex];

                    cell.style.setProperty("width", "auto", "important");

                    if (isLongContentColumn) {
                        // Для колонок с длинным контентом - минимум 200px
                        cell.style.setProperty(
                            "min-width",
                            "200px",
                            "important"
                        );
                    } else {
                        // Для обычных колонок - минимум 100px
                        cell.style.setProperty(
                            "min-width",
                            "100px",
                            "important"
                        );
                    }

                    cell.style.setProperty("max-width", "none", "important");
                    cell.style.setProperty(
                        "white-space",
                        "normal",
                        "important"
                    );
                    cell.style.setProperty(
                        "word-wrap",
                        "break-word",
                        "important"
                    );
                    cell.style.setProperty(
                        "overflow-wrap",
                        "break-word",
                        "important"
                    );
                    cell.style.setProperty(
                        "word-break",
                        "break-word",
                        "important"
                    );
                    cell.style.setProperty(
                        "text-overflow",
                        "clip",
                        "important"
                    );
                    cell.style.setProperty("overflow", "visible", "important");

                    // Убираем классы, которые могут ограничивать ширину
                    cell.classList.remove(
                        "text-truncate",
                        "text-nowrap",
                        "w-25",
                        "w-50",
                        "w-75",
                        "w-100"
                    );

                    // Обрабатываем вложенные элементы
                    const nestedElements = cell.querySelectorAll("*");
                    nestedElements.forEach((nested) => {
                        nested.style.setProperty(
                            "max-width",
                            "none",
                            "important"
                        );
                        nested.style.setProperty(
                            "white-space",
                            "normal",
                            "important"
                        );
                        nested.style.setProperty(
                            "word-wrap",
                            "break-word",
                            "important"
                        );
                        nested.style.setProperty(
                            "overflow-wrap",
                            "break-word",
                            "important"
                        );
                    });
                }
            });
        });
    }

    // Применяем исправления сразу
    forceFixTables();

    // Применяем исправления через небольшую задержку (на случай динамической загрузки)
    setTimeout(forceFixTables, 100);
    setTimeout(forceFixTables, 500);
    setTimeout(forceFixTables, 1000);

    // Следим за изменениями в DOM
    const observer = new MutationObserver(function (mutations) {
        let shouldReapply = false;

        mutations.forEach(function (mutation) {
            if (
                mutation.type === "childList" ||
                mutation.type === "attributes"
            ) {
                const target = mutation.target;
                if (
                    target.classList &&
                    (target.classList.contains("table") ||
                        target.closest(".table"))
                ) {
                    shouldReapply = true;
                }
            }
        });

        if (shouldReapply) {
            setTimeout(forceFixTables, 50);
        }
    });

    // Наблюдаем за всем документом
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
    });

    // Переопределяем любые попытки установить ограничивающие стили
    const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function (
        property,
        value,
        priority
    ) {
        const element = this.parentRule
            ? null
            : this.parentElement || this.ownerNode;

        if (element && element.closest && element.closest(".table")) {
            const cell =
                element.tagName === "TH" || element.tagName === "TD"
                    ? element
                    : element.closest("th, td");

            if (cell) {
                const row = cell.parentElement;
                const cellIndex = Array.from(row.children).indexOf(cell);

                // Не трогаем первую колонку
                if (cellIndex > 0) {
                    // Блокируем установку ограничивающих свойств
                    if (property === "width" && value !== "auto") return;
                    if (
                        property === "min-width" &&
                        !["100px", "200px", "auto"].includes(value)
                    )
                        return;
                    if (property === "max-width" && value !== "none") return;
                    if (property === "white-space" && value !== "normal")
                        return;
                }
            }
        }

        return originalSetProperty.call(this, property, value, priority);
    };

    // Добавляем hover эффекты
    document.addEventListener("mouseover", function (e) {
        if (e.target.closest(".table tbody tr")) {
            const row = e.target.closest(".table tbody tr");
            row.style.backgroundColor = "#f5f5f5";
        }
    });

    document.addEventListener("mouseout", function (e) {
        if (e.target.closest(".table tbody tr")) {
            const row = e.target.closest(".table tbody tr");
            row.style.backgroundColor = "";
        }
    });

    console.log("FORCE table fixes applied successfully");
});
