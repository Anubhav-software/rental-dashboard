/**
 * Customer list page: load list via customerApi.list, render table, search, pagination, delete.
 */
(function () {
  var card = document.getElementById('customer-list-card');
  var loadingEl = document.getElementById('customer-list-loading');
  var contentEl = document.getElementById('customer-list-content');
  var errorEl = document.getElementById('customer-list-error');
  var tbody = document.getElementById('customer-list-tbody');
  var paginationEl = document.getElementById('customer-list-pagination');
  var basePath = (card && card.getAttribute('data-base-path')) || '';
  basePath = (basePath || '').replace(/\/$/, '');
  if (!basePath || /\/customer$/.test(basePath)) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';

  function getFilters() {
    var searchEl = document.getElementById('customer-search');
    var initialPage = card && card.getAttribute('data-page');
    var initialLimit = card && card.getAttribute('data-limit');
    return {
      search: (searchEl && searchEl.value) ? searchEl.value.trim() : '',
      page: parseInt(sessionStorage.getItem('customerListPage') || initialPage || '1', 10),
      limit: parseInt(initialLimit || '20', 10)
    };
  }

  function setPage(p) {
    sessionStorage.setItem('customerListPage', String(p));
  }

  function renderRow(c, index) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + (index + 1) + '</td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + (c.name || '-') + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + (c.phone || '-') + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + (c.email || '-') + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + (c.nationality || '-') + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + (c.hotelName || '-') + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + (c.roomNo || '-') + '</span></td>' +
      '<td class="text-center"><div class="d-flex align-items-center gap-10 justify-content-center">' +
      '<a href="' + basePath + '/customer/view/' + encodeURIComponent(c.id) + '" class="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle text-decoration-none"><iconify-icon icon="majesticons:eye-line" class="icon text-xl"></iconify-icon></a>' +
      '<a href="' + basePath + '/customer/edit/' + encodeURIComponent(c.id) + '" class="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle text-decoration-none"><iconify-icon icon="lucide:edit" class="menu-icon"></iconify-icon></a>' +
      '<button type="button" class="customer-delete-btn remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" data-customer-id="' + encodeURIComponent(c.id) + '"><iconify-icon icon="fluent:delete-24-regular" class="menu-icon"></iconify-icon></button>' +
      '</div></td>';
    var deleteBtn = tr.querySelector('.customer-delete-btn');
    if (deleteBtn && window.customerApi && window.customerApi.delete) {
      deleteBtn.addEventListener('click', function () {
        var id = this.getAttribute('data-customer-id');
        if (!id || !confirm('Are you sure you want to delete this customer?')) return;
        window.customerApi.delete(id).then(function () {
          if (window.showToast) window.showToast('Customer deleted successfully.', 'success');
          loadList();
        }).catch(function (err) {
          if (window.showToast) window.showToast(err.message || 'Delete failed', 'error');
          else alert(err.message || 'Delete failed');
        });
      });
    }
    return tr;
  }

  function renderPagination(pagination) {
    if (!pagination || pagination.totalPages <= 1) {
      paginationEl.innerHTML = '<span class="text-secondary-light text-sm">Page ' + (pagination ? pagination.page : 1) + ' of ' + (pagination ? Math.max(1, pagination.totalPages) : 1) + '</span>';
      return;
    }
    var p = pagination.page;
    var totalPages = pagination.totalPages;
    var prevDisabled = p <= 1 ? ' disabled' : '';
    var nextDisabled = p >= totalPages ? ' disabled' : '';
    paginationEl.innerHTML =
      '<span class="text-secondary-light text-sm">Page ' + p + ' of ' + totalPages + ' (' + (pagination.total || 0) + ' total)</span>' +
      '<div class="d-flex gap-2">' +
      '<button type="button" class="btn btn-sm border border-neutral-400 radius-8' + prevDisabled + '" id="customer-prev-page">Previous</button>' +
      '<button type="button" class="btn btn-sm border border-neutral-400 radius-8' + nextDisabled + '" id="customer-next-page">Next</button>' +
      '</div>';
    var prevBtn = document.getElementById('customer-prev-page');
    var nextBtn = document.getElementById('customer-next-page');
    if (prevBtn && !prevDisabled) prevBtn.addEventListener('click', function () { setPage(p - 1); loadList(); });
    if (nextBtn && !nextDisabled) nextBtn.addEventListener('click', function () { setPage(p + 1); loadList(); });
  }

  var searchTimeout;
  function loadList() {
    if (!window.customerApi || !window.customerApi.list) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Customer API not loaded.'; }
      return;
    }
    if (loadingEl) loadingEl.classList.remove('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');
    var params = getFilters();
    setPage(params.page);
    if (!params.search) delete params.search;
    window.customerApi.list(params).then(function (data) {
      if (loadingEl) loadingEl.classList.add('d-none');
      var customers = (data && data.customers) ? data.customers : [];
      var pagination = (data && data.pagination) ? data.pagination : { page: 1, limit: 20, total: 0, totalPages: 0 };
      if (data && data.total != null && !data.pagination) {
        pagination = { page: 1, limit: params.limit || 20, total: data.total, totalPages: 1 };
      }
      tbody.innerHTML = '';
      if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary-light py-24">No customers found.</td></tr>';
      } else {
        customers.forEach(function (c, i) { tbody.appendChild(renderRow(c, i)); });
      }
      renderPagination(pagination);
      if (contentEl) contentEl.classList.remove('d-none');
    }).catch(function (err) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) {
        errorEl.classList.remove('d-none');
        errorEl.textContent = err.message || 'Failed to load customers.';
      }
    });
  }

  var searchEl = document.getElementById('customer-search');
  if (searchEl) {
    searchEl.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function () {
        setPage(1);
        loadList();
      }, 350);
    });
    searchEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchTimeout);
        setPage(1);
        loadList();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadList);
  } else {
    loadList();
  }
})();
