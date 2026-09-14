<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ResolvesBranch;
use App\Http\Requests\StorePurchaseRequest;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Services\PurchaseService;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    use ResolvesBranch;

    public function index(): Response
    {
        $branch = $this->resolveBranch(request());

        return Inertia::render('purchases/index', [
            'branch' => $branch,
            'branches' => $this->branchOptions(),
            'isOwner' => request()->user()->isOwner(),
            'purchases' => Purchase::forBranch($branch->id)->with('supplier')->latest()->paginate(20)->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        $branch = $this->resolveBranch(request());

        return Inertia::render('purchases/create', [
            'branch' => $branch,
            'branches' => $this->branchOptions(),
            'isOwner' => request()->user()->isOwner(),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(),
            'products' => Product::forBranch($branch->id)->active()->with('priceTiers')->orderBy('name')->get(),
        ]);
    }

    public function show(Purchase $purchase): Response
    {
        $this->authorizeBranch($purchase->branch_id);

        return Inertia::render('purchases/show', [
            'purchase' => $purchase->load('items.product', 'supplier', 'branch'),
        ]);
    }

    public function store(StorePurchaseRequest $request)
    {
        $data = $request->validated();
        $branch = Branch::findOrFail($data['branch_id']);
        $this->authorizeBranch($branch->id);

        $purchase = PurchaseService::create(
            $branch,
            $data['supplier_id'] ?? null,
            $request->user()->id,
            $data['purchase_date'],
            $data['items']
        );

        return redirect()->route('purchases.show', $purchase)->with('success', 'Pembelian '.$purchase->invoice_no.' tersimpan.');
    }

    private function authorizeBranch(int $branchId): void
    {
        $user = request()->user();
        if (! $user->isOwner() && $user->branch_id !== $branchId) {
            abort(403, 'Akses cabang ditolak.');
        }
    }
}
