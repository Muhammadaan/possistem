<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ResolvesBranch;
use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use ResolvesBranch;

    public function index(): Response
    {
        $branch = $this->resolveBranch(request());
        $q = request()->query('q');

        $products = Product::forBranch($branch->id)
            ->with('priceTiers')
            ->when($q, fn ($query) => $query->where(fn ($w) => $w->where('sku', 'like', "%$q%")->orWhere('name', 'like', "%$q%")))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('products/index', [
            'branch' => $branch,
            'branches' => $this->branchOptions(),
            'isOwner' => request()->user()->isOwner(),
            'products' => $products,
            'q' => $q,
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();
        $branch = $this->resolveBranch($request);
        abort_if((int) $data['branch_id'] !== $branch->id && ! $request->user()->isOwner(), 403);

        $openingStock = (float) ($data['opening_stock'] ?? 0);
        $initialCost = (float) ($data['initial_cost'] ?? 0);

        DB::transaction(function () use ($data, $openingStock, $initialCost) {
            $product = Product::create([
                'branch_id' => $data['branch_id'],
                'sku' => $data['sku'],
                'name' => $data['name'],
                'unit' => $data['unit'] ?? 'pcs',
                'selling_price' => $data['selling_price'],
                'average_cost' => $initialCost,
                'stock' => $openingStock,
                'is_active' => $data['is_active'] ?? true,
            ]);

            foreach ($data['tiers'] ?? [] as $tier) {
                $product->priceTiers()->create($tier);
            }

            if ($openingStock != 0) {
                StockMovement::create([
                    'branch_id' => $data['branch_id'],
                    'product_id' => $product->id,
                    'type' => StockMovement::TYPE_ADJUSTMENT,
                    'reference_type' => null,
                    'reference_id' => null,
                    'qty' => $openingStock,
                    'stock_before' => 0,
                    'stock_after' => $openingStock,
                    'note' => 'Stok awal',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Produk dibuat.');
    }

    public function update(StoreProductRequest $request, Product $product)
    {
        $data = $request->validated();
        $user = $request->user();
        if (! $user->isOwner()) {
            abort_if($product->branch_id !== $user->branch_id, 403);
            abort_if((int) $data['branch_id'] !== $user->branch_id, 403);
        }

        $product->update([
            'branch_id' => $data['branch_id'],
            'sku' => $data['sku'],
            'name' => $data['name'],
            'unit' => $data['unit'] ?? 'pcs',
            'selling_price' => $data['selling_price'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        if (array_key_exists('tiers', $data)) {
            $product->priceTiers()->delete();
            foreach ($data['tiers'] ?? [] as $tier) {
                $product->priceTiers()->create($tier);
            }
        }

        return redirect()->back()->with('success', 'Produk diupdate.');
    }

    public function destroy(Product $product)
    {
        $user = request()->user();
        if (! $user->isOwner()) {
            abort_if($product->branch_id !== $user->branch_id, 403);
        }

        if ($product->purchaseItems()->exists() || $product->saleItems()->exists()) {
            return redirect()->back()->withErrors(['delete' => 'Produk tidak bisa dihapus karena sudah ada transaksi.']);
        }

        $product->delete();

        return redirect()->back()->with('success', 'Produk dihapus.');
    }
}
