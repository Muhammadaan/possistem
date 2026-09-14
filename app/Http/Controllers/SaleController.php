<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ResolvesBranch;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Services\SaleService;
use App\Services\StockAdjustmentService;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    use ResolvesBranch;

    public function index(): Response
    {
        $branch = $this->resolveBranch(request());

        return Inertia::render('sales/index', [
            'branch' => $branch,
            'branches' => $this->branchOptions(),
            'isOwner' => request()->user()->isOwner(),
            'sales' => Sale::forBranch($branch->id)->latest()->paginate(20)->withQueryString(),
        ]);
    }

    public function pos(): Response
    {
        $branch = $this->resolveBranch(request());

        return Inertia::render('sales/pos', [
            'branch' => $branch,
            'branches' => $this->branchOptions(),
            'isOwner' => request()->user()->isOwner(),
            'products' => Product::forBranch($branch->id)->active()->orderBy('name')->get(),
        ]);
    }

    public function show(Sale $sale): Response
    {
        $this->authorizeBranch($sale->branch_id);

        return Inertia::render('sales/show', [
            'sale' => $sale->load('items.product', 'branch'),
        ]);
    }

    public function store(StoreSaleRequest $request)
    {
        $data = $request->validated();
        $branch = Branch::findOrFail($data['branch_id']);
        $this->authorizeBranch($branch->id);

        $sale = SaleService::create(
            $branch,
            $request->user()->id,
            $data['sale_date'] ?? now()->toDateTimeString(),
            $data['payment_method'],
            (float) $data['paid_amount'],
            $data['items']
        );

        return redirect()->route('sales.show', $sale)->with('success', 'Penjualan '.$sale->invoice_no.' tersimpan.');
    }

    public function adjust(AdjustStockRequest $request)
    {
        $data = $request->validated();
        $branch = Branch::findOrFail($data['branch_id']);
        $this->authorizeBranch($branch->id);

        StockAdjustmentService::adjust($branch, $data['product_id'], (float) $data['new_stock'], $request->user()->id, $data['note'] ?? null);

        return redirect()->back()->with('success', 'Stok disesuaikan.');
    }

    public function ledger(): Response
    {
        $branch = $this->resolveBranch(request());

        return Inertia::render('stocks/ledger', [
            'branch' => $branch,
            'branches' => $this->branchOptions(),
            'isOwner' => request()->user()->isOwner(),
            'movements' => StockMovement::forBranch($branch->id)->with('product')->latest()->paginate(30)->withQueryString(),
        ]);
    }

    private function authorizeBranch(int $branchId): void
    {
        $user = request()->user();
        if (! $user->isOwner() && $user->branch_id !== $branchId) {
            abort(403, 'Akses cabang ditolak.');
        }
    }
}
