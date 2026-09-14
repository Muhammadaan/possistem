<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ResolvesBranch;
use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
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

        $product = Product::create([
            'branch_id' => $data['branch_id'],
            'sku' => $data['sku'],
            'name' => $data['name'],
            'unit' => $data['unit'] ?? 'pcs',
            'selling_price' => $data['selling_price'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        foreach ($data['tiers'] ?? [] as $tier) {
            $product->priceTiers()->create($tier);
        }

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
}
